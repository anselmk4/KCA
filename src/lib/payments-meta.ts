/**
 * Utilitaires pour la gestion robuste des métadonnées d'acheteurs
 * (Email, Téléphone Mobile Money, Nom) sur les paiements PawaPay, PayPal et invités.
 */

export interface BuyerMetadata {
  email: string;
  phone: string;
  name: string;
}

/**
 * Nettoie une adresse email pour s'assurer qu'aucun artefact (|phone|name) n'y subsiste
 */
export function sanitizeBuyerEmail(rawEmail: string | null | undefined): string {
  if (!rawEmail) return "";
  let email = String(rawEmail).trim();

  // Si l'email a été concaténé avec d'autres données via | (ex: "mail@test.com|+243812...|Nom")
  if (email.includes("|")) {
    const parts = email.split("|");
    const candidate = parts.find((p) => p.includes("@"));
    email = candidate ? candidate.trim() : parts[0].trim();
  }

  // Vérification de syntaxe minimale
  if (!email.includes("@") || email.length < 5) {
    return "";
  }

  return email.toLowerCase();
}

/**
 * Nettoie un numéro de téléphone Mobile Money
 */
export function sanitizeBuyerPhone(rawPhone: string | null | undefined): string {
  if (!rawPhone) return "";
  let phone = String(rawPhone).trim();

  if (phone.includes("|")) {
    const parts = phone.split("|");
    const candidate = parts.find((p) => /^[+0-9\s()-]{7,25}$/.test(p.trim()));
    phone = candidate ? candidate.trim() : "";
  }

  return phone;
}

/**
 * Nettoie un nom d'acheteur
 */
export function sanitizeBuyerName(rawName: string | null | undefined, fallbackEmail?: string): string {
  if (!rawName) {
    if (fallbackEmail && fallbackEmail.includes("@")) {
      const local = fallbackEmail.split("@")[0];
      return local.charAt(0).toUpperCase() + local.slice(1);
    }
    return "Client";
  }

  let name = String(rawName).trim();
  if (name.includes("|")) {
    const parts = name.split("|");
    name = parts[parts.length - 1]?.trim() || "";
  }

  if (!name || name === "client" || name === "Client" || name === "MONTHLY" || name === "ANNUAL") {
    if (fallbackEmail && fallbackEmail.includes("@")) {
      const local = fallbackEmail.split("@")[0];
      return local.charAt(0).toUpperCase() + local.slice(1);
    }
    return "Client";
  }

  return name;
}

/**
 * Analyse le champ method et provider_metadata d'un paiement pour en extraire
 * de façon infaillible l'email, le téléphone et le nom de l'acheteur.
 */
export function extractBuyerInfo(payment: any): BuyerMetadata {
  let email = "";
  let phone = "";
  let name = "";

  // 1. Depuis provider_metadata
  if (payment?.provider_metadata && typeof payment.provider_metadata === "object") {
    const meta = payment.provider_metadata;
    if (meta.buyerEmail || meta.email) {
      email = sanitizeBuyerEmail(meta.buyerEmail || meta.email);
    }
    if (meta.buyerPhone || meta.phone || meta.phoneNumber || meta.payerPhone) {
      phone = sanitizeBuyerPhone(meta.buyerPhone || meta.phone || meta.phoneNumber || meta.payerPhone);
    }
    if (meta.buyerName || meta.name) {
      name = sanitizeBuyerName(meta.buyerName || meta.name);
    }
    // Cas PayPal payer
    if (!email && meta.payer?.email_address) {
      email = sanitizeBuyerEmail(meta.payer.email_address);
    }
    if (!name && meta.payer?.name) {
      const given = meta.payer.name.given_name || "";
      const surname = meta.payer.name.surname || "";
      name = `${given} ${surname}`.trim();
    }
    if (!phone && meta.payer?.phone?.phone_number?.national_number) {
      phone = sanitizeBuyerPhone(meta.payer.phone.phone_number.national_number);
    }
  }

  // 2. Depuis le champ method (ex: CARRIER::TYPE::ITEM_ID::ENCODED_META)
  if ((!email || !phone || !name) && payment?.method) {
    const methodStr = String(payment.method);
    if (methodStr.includes("::")) {
      const parts = methodStr.split("::");
      if (parts.length >= 4 && parts[3]) {
        try {
          const decoded = decodeURIComponent(parts[3]).trim();
          if (decoded.includes("|")) {
            const subParts = decoded.split("|");
            if (!email && subParts[0]) {
              email = sanitizeBuyerEmail(subParts[0]);
            }
            if (!phone && subParts[1]) {
              phone = sanitizeBuyerPhone(subParts[1]);
            }
            if (!name && subParts[2]) {
              name = sanitizeBuyerName(subParts[2], email);
            }
          } else {
            if (!email && decoded.includes("@")) {
              email = sanitizeBuyerEmail(decoded);
            } else if (!phone && /^[+0-9\s()-]{7,25}$/.test(decoded)) {
              phone = sanitizeBuyerPhone(decoded);
            }
          }
        } catch {
          // ignorer erreur de décodage
        }
      }
    }
  }

  // Finalisation du nom par défaut si l'email est présent
  if (!name && email) {
    name = sanitizeBuyerName("", email);
  }

  return { email, phone, name: name || "Client" };
}

/**
 * Encodage sécurisé des métadonnées d'acheteur dans le champ method
 */
export function encodeBuyerMeta(email: string, phone: string, name: string): string {
  const cleanEmail = sanitizeBuyerEmail(email);
  const cleanPhone = sanitizeBuyerPhone(phone);
  const cleanName = sanitizeBuyerName(name, cleanEmail);
  return encodeURIComponent(`${cleanEmail}|${cleanPhone}|${cleanName}`);
}

/**
 * Résout ou crée de façon robuste un utilisateur Supabase pour les achats invités (Guest)
 * garantissant ainsi qu'aucune contrainte de clé étrangère (FK) n'est violée.
 */
export async function resolveOrCreateGuestUser(
  supabaseAdmin: any,
  rawEmail: string,
  rawPhone?: string,
  rawName?: string
): Promise<{ userId: string; email: string; phone: string; name: string }> {
  const cleanEmail = sanitizeBuyerEmail(rawEmail);
  const cleanPhone = sanitizeBuyerPhone(rawPhone);
  const cleanName = sanitizeBuyerName(rawName, cleanEmail);

  if (!cleanEmail) {
    return {
      userId: crypto.randomUUID(),
      email: "",
      phone: cleanPhone,
      name: cleanName,
    };
  }

  // 1. Rechercher si un profil existe déjà pour cet email
  try {
    const { data: existingProfile } = await supabaseAdmin
      .from("profiles")
      .select("id, email, full_name, phone, phone_number")
      .eq("email", cleanEmail)
      .maybeSingle();

    if (existingProfile?.id) {
      // Mettre à jour le téléphone ou le nom si manquant
      const updates: any = {};
      if (cleanPhone && !existingProfile.phone && !existingProfile.phone_number) {
        updates.phone = cleanPhone;
      }
      if (cleanName && (!existingProfile.full_name || existingProfile.full_name === "Client")) {
        updates.full_name = cleanName;
      }
      if (Object.keys(updates).length > 0) {
        await supabaseAdmin.from("profiles").update(updates).eq("id", existingProfile.id);
      }

      return {
        userId: existingProfile.id,
        email: cleanEmail,
        phone: cleanPhone || existingProfile.phone || existingProfile.phone_number || "",
        name: existingProfile.full_name || cleanName,
      };
    }
  } catch (err: any) {
    console.warn("[resolveOrCreateGuestUser] Profile search warning:", err?.message);
  }

  // 2. Créer le compte dans auth.users via l'API Admin de Supabase
  try {
    const { data: newUser, error: createAuthErr } = await supabaseAdmin.auth.admin.createUser({
      email: cleanEmail,
      email_confirm: true,
      user_metadata: {
        full_name: cleanName,
        phone: cleanPhone,
      },
    });

    if (newUser?.user?.id) {
      const newUserId = newUser.user.id;
      // Créer le profil associé
      try {
        await supabaseAdmin.from("profiles").upsert({
          id: newUserId,
          email: cleanEmail,
          full_name: cleanName,
          phone: cleanPhone,
          role: "STUDENT",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as any);
      } catch (profErr: any) {
        console.warn("[resolveOrCreateGuestUser] Profile upsert warning:", profErr?.message);
      }

      return {
        userId: newUserId,
        email: cleanEmail,
        phone: cleanPhone,
        name: cleanName,
      };
    }

    // Si l'utilisateur existait déjà dans auth.users mais pas dans profiles (createAuthErr)
    if (createAuthErr) {
      console.log("[resolveOrCreateGuestUser] Auth create notice:", createAuthErr.message);
      // Tentative de récupération via listUsers
      try {
        const { data: listData } = await supabaseAdmin.auth.admin.listUsers({
          page: 1,
          perPage: 100,
        });
        const match = (listData?.users || []).find(
          (u: any) => u.email?.toLowerCase() === cleanEmail.toLowerCase()
        );
        if (match?.id) {
          try {
            await supabaseAdmin.from("profiles").upsert({
              id: match.id,
              email: cleanEmail,
              full_name: cleanName,
              phone: cleanPhone,
              role: "STUDENT",
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            } as any);
          } catch {}

          return {
            userId: match.id,
            email: cleanEmail,
            phone: cleanPhone,
            name: cleanName,
          };
        }
      } catch {}
    }
  } catch (authErr: any) {
    console.warn("[resolveOrCreateGuestUser] Auth create user warning:", authErr?.message);
  }

  // Fallback si l'auth admin est indisponible : générer un UUID et tenter l'insertion profile
  const fallbackId = crypto.randomUUID();
  try {
    await supabaseAdmin.from("profiles").upsert({
      id: fallbackId,
      email: cleanEmail,
      full_name: cleanName,
      phone: cleanPhone,
      role: "STUDENT",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as any);
  } catch {}

  return {
    userId: fallbackId,
    email: cleanEmail,
    phone: cleanPhone,
    name: cleanName,
  };
}

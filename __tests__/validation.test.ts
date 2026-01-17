import { brandRegistrationSchema } from "@/lib/validation/brand-schema";

/**
 * Tests exhaustivos para las validaciones de formularios
 * Cubre todas las reglas implementadas en brandRegistrationSchema
 */

describe("Brand Registration Schema Validation", () => {
  describe("Email Validation", () => {
    it("should accept valid emails", () => {
      const validEmails = [
        "test@example.com",
        "user.name@domain.co",
        "test+tag@gmail.com",
        "user@subdomain.domain.com"
      ];

      validEmails.forEach(email => {
        const result = brandRegistrationSchema.safeParse({ correo: email });
        expect(result.success).toBe(true);
      });
    });

    it("should reject invalid email formats", () => {
      const invalidEmails = [
        "notanemail",
        "@domain.com",
        "user@",
        "user@.com",
        "user..double@domain.com"
      ];

      invalidEmails.forEach(email => {
        const result = brandRegistrationSchema.safeParse({ correo: email });
        expect(result.success).toBe(false);
      });
    });

    it("should reject disposable email domains", () => {
      const disposableEmails = [
        "test@10minutemail.com",
        "user@guerrillamail.com",
        "test@mailinator.com"
      ];

      disposableEmails.forEach(email => {
        const result = brandRegistrationSchema.safeParse({ correo: email });
        expect(result.success).toBe(false);
        expect(result.error?.issues[0]?.message).toContain("no aceptamos emails temporales");
      });
    });

    it("should accept optional empty email", () => {
      const result = brandRegistrationSchema.safeParse({ correo: "" });
      expect(result.success).toBe(true);
    });
  });

  describe("WhatsApp Validation", () => {
    it("should accept valid WhatsApp numbers for LATAM countries", () => {
      const validNumbers = [
        "+51987654321", // Perú
        "+521234567890", // México
        "+54987654321", // Argentina
        "+5511987654321", // Brasil
        "+56987654321", // Chile
        "+573001234567", // Colombia
        "+34612345678", // España
      ];

      validNumbers.forEach(number => {
        const result = brandRegistrationSchema.safeParse({
          whatsapp: number,
          negocio: "Test Business"
        });
        expect(result.success).toBe(true);
      });
    });

    it("should reject invalid country codes", () => {
      const invalidNumbers = [
        "+99987654321", // Código no válido
        "+44987654321", // Reino Unido (no soportado)
        "+81987654321", // Japón (no soportado)
      ];

      invalidNumbers.forEach(number => {
        const result = brandRegistrationSchema.safeParse({
          whatsapp: number,
          negocio: "Test Business"
        });
        expect(result.success).toBe(false);
      });
    });

    it("should reject malformed numbers", () => {
      const malformedNumbers = [
        "987654321", // Sin +
        "+51 987654321", // Con espacios
        "+51-987654321", // Con guiones
        "+51(987)654321", // Con paréntesis
        "+51987", // Demasiado corto
        "+519876543210987654321", // Demasiado largo
      ];

      malformedNumbers.forEach(number => {
        const result = brandRegistrationSchema.safeParse({
          whatsapp: number,
          negocio: "Test Business"
        });
        expect(result.success).toBe(false);
      });
    });

    it("should be required", () => {
      const result = brandRegistrationSchema.safeParse({
        negocio: "Test Business"
        // whatsapp missing
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.some(issue => issue.path.includes('whatsapp'))).toBe(true);
    });
  });

  describe("Instagram URL Validation", () => {
    it("should accept valid Instagram URLs", () => {
      const validUrls = [
        "https://www.instagram.com/username",
        "https://instagram.com/username",
        "https://www.instagram.com/user_name.123"
      ];

      validUrls.forEach(url => {
        const result = brandRegistrationSchema.safeParse({
          instagram: url,
          whatsapp: "+51987654321",
          negocio: "Test Business"
        });
        expect(result.success).toBe(true);
      });
    });

    it("should reject HTTP URLs", () => {
      const result = brandRegistrationSchema.safeParse({
        instagram: "http://www.instagram.com/username",
        whatsapp: "+51987654321",
        negocio: "Test Business"
      });
      expect(result.success).toBe(false);
    });

    it("should reject non-Instagram domains", () => {
      const invalidUrls = [
        "https://www.facebook.com/username",
        "https://www.twitter.com/username",
        "https://www.instagram.fake.com/username"
      ];

      invalidUrls.forEach(url => {
        const result = brandRegistrationSchema.safeParse({
          instagram: url,
          whatsapp: "+51987654321",
          negocio: "Test Business"
        });
        expect(result.success).toBe(false);
      });
    });

    it("should reject URLs without username", () => {
      const result = brandRegistrationSchema.safeParse({
        instagram: "https://www.instagram.com/",
        whatsapp: "+51987654321",
        negocio: "Test Business"
      });
      expect(result.success).toBe(false);
    });

    it("should be optional", () => {
      const result = brandRegistrationSchema.safeParse({
        whatsapp: "+51987654321",
        negocio: "Test Business"
        // instagram missing
      });
      expect(result.success).toBe(true);
    });
  });

  describe("Business Name Validation", () => {
    it("should accept valid business names", () => {
      const validNames = [
        "Restaurante El Buen Sabor",
        "Café Paradiso",
        "Mi Negocio SRL",
        "ABC"
      ];

      validNames.forEach(name => {
        const result = brandRegistrationSchema.safeParse({
          negocio: name,
          whatsapp: "+51987654321"
        });
        expect(result.success).toBe(true);
      });
    });

    it("should reject names too short or too long", () => {
      const invalidNames = [
        "AB", // Too short
        "A".repeat(81), // Too long
      ];

      invalidNames.forEach(name => {
        const result = brandRegistrationSchema.safeParse({
          negocio: name,
          whatsapp: "+51987654321"
        });
        expect(result.success).toBe(false);
      });
    });

    it("should reject dangerous characters", () => {
      const dangerousNames = [
        "Negocio<script>alert('xss')</script>",
        'Negocio"con"comillas',
        "Negocio<con>tags",
        "Negocio'con'quotes"
      ];

      dangerousNames.forEach(name => {
        const result = brandRegistrationSchema.safeParse({
          negocio: name,
          whatsapp: "+51987654321"
        });
        expect(result.success).toBe(false);
        expect(result.error?.issues[0]?.message).toContain("caracteres no permitidos");
      });
    });
  });

  describe("Security Validation (XSS Prevention)", () => {
    const testFields = ['emprendedor', 'ciudad', 'pais', 'descripcion'] as const;

    it("should sanitize dangerous characters", () => {
      const dangerousInputs = [
        "<script>alert('xss')</script>",
        '<iframe src="evil.com"></iframe>',
        'text"with"quotes',
        "text'with'quotes",
        "text<with>tags",
        "text`with`backticks"
      ];

      testFields.forEach(field => {
        dangerousInputs.forEach(input => {
          const result = brandRegistrationSchema.safeParse({
            [field]: input,
            whatsapp: "+51987654321",
            negocio: "Test Business"
          });
          expect(result.success).toBe(false);
          expect(result.error?.issues[0]?.message).toContain("caracteres");
        });
      });
    });

    it("should accept safe text", () => {
      const safeInputs = [
        "Texto normal y seguro",
        "Texto con números 123",
        "Texto con acentos: áéíóú",
        "Texto con puntos, comas; y signos: ¿?¡!",
        "Multilínea\ncon\nsaltos"
      ];

      testFields.forEach(field => {
        safeInputs.forEach(input => {
          const result = brandRegistrationSchema.safeParse({
            [field]: input,
            whatsapp: "+51987654321",
            negocio: "Test Business"
          });
          expect(result.success).toBe(true);
        });
      });
    });
  });

  describe("Length Validation", () => {
    it("should enforce proper lengths for all fields", () => {
      // emprendedor: 2-50 chars
      expect(brandRegistrationSchema.safeParse({
        emprendedor: "A",
        whatsapp: "+51987654321",
        negocio: "Test Business"
      }).success).toBe(false);

      expect(brandRegistrationSchema.safeParse({
        emprendedor: "A".repeat(51),
        whatsapp: "+51987654321",
        negocio: "Test Business"
      }).success).toBe(false);

      // ciudad: 2-50 chars
      expect(brandRegistrationSchema.safeParse({
        ciudad: "A",
        whatsapp: "+51987654321",
        negocio: "Test Business"
      }).success).toBe(false);

      // pais: 2-50 chars
      expect(brandRegistrationSchema.safeParse({
        pais: "A",
        whatsapp: "+51987654321",
        negocio: "Test Business"
      }).success).toBe(false);

      // descripcion: min 10 chars if provided
      expect(brandRegistrationSchema.safeParse({
        descripcion: "Short",
        whatsapp: "+51987654321",
        negocio: "Test Business"
      }).success).toBe(false);

      expect(brandRegistrationSchema.safeParse({
        descripcion: "Esta descripción es suficientemente larga para pasar la validación",
        whatsapp: "+51987654321",
        negocio: "Test Business"
      }).success).toBe(true);
    });
  });
});</contents>
</xai:function_call">Crear archivo de tests exhaustivos para validaciones
export type Language = "pt" | "es"

export const translations = {
  pt: {
    // Landing Page
    landing: {
      badge: "Conteúdo que vende",
      hero: {
        title: "Conteúdo profissional para seu restaurante",
        description:
          "Migraflix ajuda pequenos restaurantes na LATAM a criar conteúdo de qualidade que atrai mais clientes e aumenta vendas",
        cta: "Começar agora",
        benefits: "Ver benefícios",
      },
      stats: {
        restaurants: "Restaurantes ativos",
        content: "Conteúdos criados",
        engagement: "Aumento em engagement",
      },
      benefits: {
        title: "Por que escolher Migraflix",
        subtitle: "Criamos conteúdo que conecta com sua audiência e gera resultados reais",
        professional: {
          title: "Conteúdo profissional",
          description: "Fotos, vídeos e textos criados por especialistas que conhecem a indústria de restaurantes",
        },
        sales: {
          title: "Aumente suas vendas",
          description: "Conteúdo otimizado para redes sociais que converte seguidores em clientes",
        },
        time: {
          title: "Economize tempo",
          description: "Nós cuidamos do conteúdo enquanto você foca no seu restaurante",
        },
      },
      features: {
        title: "Tudo o que você precisa",
        subtitle: "Um sistema completo de criação de conteúdo projetado para restaurantes",
        list: [
          "Fotografia profissional de pratos",
          "Vídeos curtos para redes sociais",
          "Textos otimizados para engagement",
          "Calendário de publicações",
          "Análise de desempenho",
          "Suporte em português",
        ],
      },
      cta: {
        title: "Comece a criar conteúdo hoje",
        subtitle: "Junte-se a centenas de restaurantes na LATAM que já estão crescendo com Migraflix",
        button: "Solicitar demo gratuita",
      },
      footer: {
        description: "Sistema de criação de conteúdo para restaurantes na LATAM",
        rights: "Todos os direitos reservados.",
      },
    },
    // Brand Page
    brand: {
      title: "Migraflix IA",
      subtitle: "Conteúdo da marca",
      loading: "Carregando conteúdo...",
      error: "Erro",
      noContent: "Não temos nenhum conteúdo para revisar",
      totalPosts: "Total de posts",
      uploadPhotos: "Adicionar novas fotos",
      table: {
        image: "Imagem",
        post: "Post",
        status: "Status",
        rate: "Avaliar",
        noImage: "Sem imagem",
        noContent: "Sem conteúdo",
        noStatus: "Sem status",
      },
      status: {
        creating: "Criando",
        creatingDescription: "Processando conteúdo...",
        creatingImage: "Criando Imagem",
        creatingImageDescription: "Gerando imagem com IA...",
        creatingPost: "Criando Publicação",
        creatingPostDescription: "Gerando publicação com IA...",
        pendingReview: "Por Revisar",
        pendingReviewDescription: "Aguardando revisão",
        reviewed: "Revisado",
        reviewedDescription: "Conteúdo revisado",
        waiting: "Aguardando",
      },
    },
    // Review Page
    review: {
      pageTitle: "Avaliação de Conteúdo",
      pageSubtitle: "Revise e avalie o conteúdo do empreendedor",
      loading: "Carregando conteúdo...",
      notFound: "Registro não encontrado",
      aiPhoto: {
        title: "Informações da Foto IA",
        name: "Nome do Prato",
        namePlaceholder: "Digite o nome do prato...",
        price: "Preço (BRL)",
        pricePlaceholder: "0.00",
        ingredients: "Ingredientes",
        ingredientsPlaceholder: "Liste os ingredientes do prato...",
      },
      image: {
        title: "Imagem",
        noImage: "Sem imagem",
        rating: "Avaliação da Imagem",
        comment: "Comentário sobre a Imagem",
        commentPlaceholder: "Escreva seus comentários sobre a imagem...",
      },
      post: {
        title: "Conteúdo do Post",
        noContent: "Sem conteúdo",
        rating: "Avaliação do Post",
        comment: "Comentários sobre o Post",
        commentPlaceholder: "Escreva seus comentários sobre o conteúdo...",
      },
      save: "Salvar Avaliações",
      saving: "Salvando...",
      success: {
        title: "Obrigado pelo seu feedback",
        description: "As avaliações foram salvas com sucesso",
      },
    },
    // Thank You Page
    thankYou: {
      title: "Obrigado!",
      message: "Seu feedback foi recebido com sucesso",
      description:
        "Agradecemos muito por dedicar seu tempo para avaliar este conteúdo. Suas opiniões nos ajudam a melhorar continuamente.",
      button: "Voltar ao Migraflix",
    },
    // Brands List Page
    brands: {
      title: "Migraflix IA",
      subtitle: "Todas as marcas",
      loading: "Carregando marcas...",
      error: "Erro",
      errorDescription: "Não foi possível carregar as marcas",
      noBrands: "Nenhuma marca encontrada",
      copied: "Link copiado!",
      copiedDescription: "O link foi copiado para a área de transferência",
      shareText: "Confira o conteúdo desta marca no Migraflix:",
      table: {
        name: "Nome da Marca",
        actions: "Ações",
        noName: "Sem nome",
        copy: "Copiar Link",
        copied: "Copiado!",
        review: "Review Brand Content",
        uploadPhotos: "Adicionar fotos",
      },
    },
    // Registration Form
    registration: {
      title: "Registro de Marca",
      subtitle: "Complete o seguinte formulário para registrar seu restaurante",
      progress: "Pergunta {current} de {total}",
      completed: "{percentage}% concluído",
      questions: {
        name: "Como você se chama?",
        business: "Qual é o nome do seu negócio?",
        city: "Em que cidade fica o seu negócio?",
        country: "Em que país fica o seu negócio?",
        whatsapp: "Qual é o WhatsApp do seu negócio? Nos comunicaremos por aqui.",
        instagram: "Qual é o Instagram do seu negócio? Faremos um estudo da sua marca. Copie o link do negócio.",
        story: "Conte-nos brevemente sobre o seu negócio! Aproveitaremos esta história para gerar posts persuasivos.",
      },
      placeholders: {
        name: "Ex: João Silva",
        business: "Ex: Sabores da Venezuela",
        city: "Ex: Lima",
        country: "Selecione um país",
        whatsapp: "+51987654321",
        instagram: "https://www.instagram.com/migraflix/",
        story: "Ex: Quando cheguei a Lima, comecei fazendo arepas em casa e hoje lidero Sabores da Venezuela, um projeto que compartilha o sabor e a alegria da gastronomia venezuelana com os limeños. Os pratos estrela são a arepa reina pepiada e o pabellón criollo. Todos os pedidos são feitos com 24 horas de antecedência e me certifico de entregá-los eu mesmo nas casas dos meus clientes para apresentar os pratos.",
      },
      buttons: {
        next: "Próximo",
        back: "Voltar",
        submit: "Subir fotos",
        submitting: "Enviando...",
      },
      errors: {
        required: "Este campo é obrigatório",
        invalidWhatsApp: "Por favor, insira um número de WhatsApp válido com código do país (ex: +51987654321)",
        invalidInstagram: "Por favor, insira um link válido do Instagram (ex: https://www.instagram.com/migraflix/)",
        maxLength: "O texto não pode exceder {max} caracteres",
      },
      success: {
        title: "Registro bem-sucedido!",
        description: "Suas informações foram salvas corretamente.",
      },
      error: {
        title: "Erro",
        description: "Erro ao enviar o formulário",
      },
    },
    // Products Upload Form
    products: {
      title: "Impulsione as vendas dos seus produtos com Inteligência Artificial!",
      subtitle: "Adicione até 5 produtos à plataforma.",
      addProduct: "Adicionar Produto",
      productNumber: "PRODUTO {number}",
      fields: {
        photo: "Foto do prato",
        name: "Nome do prato",
        description: "Descrição do prato (inclui os ingredientes, história da receita ou outra coisa que você queira contar!)",
        descriptionExample: "Arepa tradicional venezuelana elaborada com massa de milho branco (sem glúten), recheada com uma mistura cremosa de frango desfiado, abacate, cebola e maionese. Esta receita nasceu em Caracas nos anos 50 e seu nome homenageia uma rainha de beleza venezuelana. É um prato emblemático da gastronomia do país, preparado com ingredientes frescos e pensado para compartilhar um pedaço da nossa história e cultura em cada mordida",
        price: "Preço",
        pricePlaceholder: "Ex: 25.50",
        tags: "Tags",
      },
      tags: {
        vegetarian: "vegetariano",
        vegan: "vegano",
        noSugar: "sem açúcar",
        noGluten: "sem glúten",
      },
      buttons: {
        addProduct: "Adicionar Produto",
        removeProduct: "Remover",
        generatePosts: "Gerar posts insuperáveis",
        generating: "Gerando...",
      },
      validation: {
        maxProducts: "Você pode adicionar no máximo 5 produtos",
        photoRequired: "A foto é obrigatória",
        nameRequired: "O nome do prato é obrigatório",
        descriptionRequired: "A descrição é obrigatória",
        photoSize: "A foto deve ter no máximo 5MB",
        photoFormat: "Apenas imagens JPG ou PNG são aceitas",
      },
      success: {
        title: "Produtos adicionados!",
        description: "Seus produtos foram salvos com sucesso.",
      },
      error: {
        title: "Erro",
        description: "Erro ao salvar os produtos",
        noRecordId: "ID do registro não encontrado",
      },
      uploading: {
        title: "Preparando suas publicações",
        description: "Por favor, aguarde enquanto processamos suas fotos e informações...",
      },
      thanks: {
        title: "Obrigado!",
        subtitle: "Estamos preparando suas fotos com Inteligência Artificial",
        description: "Em breve você receberá seus posts insuperáveis prontos para compartilhar nas redes sociais.",
        button: "Ver minha marca",
      },
    },
  },
  es: {
    // Landing Page
    landing: {
      badge: "Contenido que vende",
      hero: {
        title: "Contenido profesional para tu restaurante",
        description:
          "Migraflix ayuda a pequeños restaurantes en LATAM a crear contenido de calidad que atrae más clientes y aumenta ventas",
        cta: "Comenzar ahora",
        benefits: "Ver beneficios",
      },
      stats: {
        restaurants: "Restaurantes activos",
        content: "Contenidos creados",
        engagement: "Aumento en engagement",
      },
      benefits: {
        title: "Por qué elegir Migraflix",
        subtitle: "Creamos contenido que conecta con tu audiencia y genera resultados reais",
        professional: {
          title: "Contenido profesional",
          description: "Fotos, videos y textos creados por expertos que conocen la industria restaurantera",
        },
        sales: {
          title: "Aumenta tus ventas",
          description: "Contenido optimizado para redes sociales que convierte seguidores en clientes",
        },
        time: {
          title: "Ahorra tiempo",
          description: "Nosotros nos encargamos del contenido mientras tú te enfocas en tu restaurante",
        },
      },
      features: {
        title: "Todo lo que necesitas",
        subtitle: "Un sistema completo de creación de contenido diseñado para restaurantes",
        list: [
          "Fotografía profesional de platillos",
          "Videos cortos para redes sociales",
          "Textos optimizados para engagement",
          "Calendario de publicaciones",
          "Análisis de rendimiento",
          "Soporte en español",
        ],
      },
      cta: {
        title: "Comienza a crear contenido hoy",
        subtitle: "Únete a cientos de restaurantes en LATAM que ya están creciendo con Migraflix",
        button: "Solicitar demo gratuita",
      },
      footer: {
        description: "Sistema de creación de contenido para restaurantes en LATAM",
        rights: "Todos los derechos reservados.",
      },
    },
    // Brand Page
    brand: {
      title: "Migraflix IA",
      subtitle: "Contenido de la marca",
      loading: "Cargando contenido...",
      error: "Error",
      noContent: "No tenemos ningún contenido para revisar",
      totalPosts: "Total de posts",
      uploadPhotos: "Agregar nuevas fotos",
      table: {
        image: "Imagen",
        post: "Post",
        status: "Status",
        rate: "Calificar",
        noImage: "Sin imagen",
        noContent: "Sin contenido",
        noStatus: "Sin status",
      },
      status: {
        creating: "Creando",
        creatingDescription: "Procesando contenido...",
        creatingImage: "Creando Imagen",
        creatingImageDescription: "Generando imagen con IA...",
        creatingPost: "Creando Publicación",
        creatingPostDescription: "Generando publicación con IA...",
        pendingReview: "Por Revisar",
        pendingReviewDescription: "Esperando revisión",
        reviewed: "Revisado",
        reviewedDescription: "Contenido revisado",
        waiting: "Esperando",
      },
    },
    // Review Page
    review: {
      pageTitle: "Calificación de Contenido",
      pageSubtitle: "Revisa y califica el contenido del emprendedor",
      loading: "Cargando contenido...",
      notFound: "No se encontró el registro",
      aiPhoto: {
        title: "Información de la Foto IA",
        name: "Nombre del Platillo",
        namePlaceholder: "Escribe el nombre del platillo...",
        price: "Precio (BRL)",
        pricePlaceholder: "0.00",
        ingredients: "Ingredientes",
        ingredientsPlaceholder: "Lista los ingredientes del platillo...",
      },
      image: {
        title: "Imagen",
        noImage: "Sin imagen",
        rating: "Calificación de Imagen",
        comment: "Comentario sobre la Imagen",
        commentPlaceholder: "Escribe tus comentarios sobre la imagen...",
      },
      post: {
        title: "Contenido del Post",
        noContent: "Sin contenido",
        rating: "Calificación del Post",
        comment: "Comentarios sobre el Post",
        commentPlaceholder: "Escribe tus comentarios sobre el contenido...",
      },
      save: "Guardar Calificaciones",
      saving: "Guardando...",
      success: {
        title: "Gracias por tu feedback",
        description: "Las calificaciones se han guardado exitosamente",
      },
    },
    // Thank You Page
    thankYou: {
      title: "¡Gracias!",
      message: "Tu feedback ha sido recibido exitosamente",
      description:
        "Agradecemos mucho que hayas dedicado tu tiempo para calificar este contenido. Tus opiniones nos ayudan a mejorar continuamente.",
      button: "Volver a Migraflix",
    },
    // Brands List Page
    brands: {
      title: "Migraflix IA",
      subtitle: "Todas las marcas",
      loading: "Cargando marcas...",
      error: "Error",
      errorDescription: "No se pudieron cargar las marcas",
      noBrands: "No se encontraron marcas",
      copied: "¡Link copiado!",
      copiedDescription: "El link ha sido copiado al portapapeles",
      shareText: "Mira el contenido de esta marca en Migraflix:",
      table: {
        name: "Nombre de la Marca",
        actions: "Acciones",
        noName: "Sin nombre",
        copy: "Copiar Link",
        copied: "¡Copiado!",
        review: "Review Brand Content",
        uploadPhotos: "Agregar fotos",
      },
    },
    // Registration Form
    registration: {
      title: "Registro de Marca",
      subtitle: "Completa el siguiente formulario para registrar tu restaurante",
      progress: "Pregunta {current} de {total}",
      completed: "{percentage}% completado",
      questions: {
        name: "¿Cómo te llamas?",
        business: "¿Cuál es el nombre de tu negocio?",
        city: "¿En qué ciudad queda tu negocio?",
        country: "¿En qué país queda tu negocio?",
        whatsapp: "¿Cuál es el WhatsApp de tu negocio? Nos comunicaremos por aquí.",
        instagram: "¿Cuál es el Instagram de tu negocio? Haremos un estudio de tu marca. Copiar el link del negocio.",
        story: "Cuéntanos brevemente sobre tu negocio! Aprovecharemos esta historia para generar posts persuasivos.",
      },
      placeholders: {
        name: "Ej: Juan Pérez",
        business: "Ej: Sabores de Venezuela",
        city: "Ej: Lima",
        country: "Selecciona un país",
        whatsapp: "+51987654321",
        instagram: "https://www.instagram.com/migraflix/",
        story: "Ej: Cuando llegué a Lima, empecé haciendo arepas en casa y hoy lidero Sabores de Venezuela, un proyecto que comparte el sabor y la alegría de la gastronomía venezolana con los limeños. Los platos estrella son la arepa reina pepiada y el pabellón criollo. Todos los pedidos se hacen con 24 horas de anticipación y me aseguro de entregarlos yo mismo en las casas de mis clientes para presentar los platos.",
      },
      buttons: {
        next: "Siguiente",
        back: "Atrás",
        submit: "Subir fotos",
        submitting: "Enviando...",
      },
      errors: {
        required: "Este campo es obligatorio",
        invalidWhatsApp: "Por favor ingresa un número de WhatsApp válido con código de país (ej: +51987654321)",
        invalidInstagram: "Por favor ingresa un link válido de Instagram (ej: https://www.instagram.com/migraflix/)",
        maxLength: "El texto no puede exceder {max} caracteres",
      },
      success: {
        title: "¡Registro exitoso!",
        description: "Tu información ha sido guardada correctamente.",
      },
      error: {
        title: "Error",
        description: "Error al enviar el formulario",
      },
    },
    // Products Upload Form
    products: {
      title: "¡Impulsa las ventas de tus productos con Inteligencia Artificial!",
      subtitle: "Agrega hasta 5 productos a la plataforma.",
      addProduct: "Agregar Producto",
      productNumber: "PRODUCTO {number}",
      fields: {
        photo: "Foto del plato",
        name: "Nombre del plato",
        description: "Descripción del plato (incluye los ingredientes, historia de la receta o otra cosa que quieras contar!)",
        descriptionExample: "Arepa tradicional venezolana elaborada con masa de maíz blanco (sin gluten), rellena con una mezcla cremosa de pollo desmechado, aguacate, cebolla y mayonesa. Esta receta nació en Caracas en los años 50 y su nombre rinde homenaje a una reina de belleza venezolana. Es un plato emblemático de la gastronomía del país, preparado con ingredientes frescos y pensado para compartir un pedazo de nuestra historia y cultura en cada bocado",
        price: "Precio",
        pricePlaceholder: "Ej: 25.50",
        tags: "Tags",
      },
      tags: {
        vegetarian: "vegetariano",
        vegan: "vegano",
        noSugar: "sin azúcar",
        noGluten: "sin gluten",
      },
      buttons: {
        addProduct: "Agregar Producto",
        removeProduct: "Eliminar",
        generatePosts: "Generar posts insuperables",
        generating: "Generando...",
      },
      validation: {
        maxProducts: "Puedes agregar máximo 5 productos",
        photoRequired: "La foto es obligatoria",
        nameRequired: "El nombre del plato es obligatorio",
        descriptionRequired: "La descripción es obligatoria",
        photoSize: "La foto debe tener máximo 5MB",
        photoFormat: "Solo se aceptan imágenes JPG o PNG",
      },
      success: {
        title: "¡Productos agregados!",
        description: "Tus productos han sido guardados exitosamente.",
      },
      error: {
        title: "Error",
        description: "Error al guardar los productos",
        noRecordId: "ID de registro no encontrado",
      },
      uploading: {
        title: "Preparando tus publicaciones",
        description: "Por favor, espera mientras procesamos tus fotos e información...",
      },
      thanks: {
        title: "¡Gracias!",
        subtitle: "Estamos preparando tus fotos con Inteligencia Artificial",
        description: "Pronto recibirás tus posts insuperables listos para compartir en redes sociales.",
        button: "Ver mi marca",
      },
    },
  },
}

export function getTranslations(lang: Language) {
  return translations[lang]
}

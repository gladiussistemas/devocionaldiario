const { GoogleGenerativeAI } = require("@google/generative-ai");

// Usando a API key do .env
const API_KEY = "AIzaSyCKUnn2-7QBy--082LBz9krU_U0hxWzrQI";

async function listAvailableModels() {
  if (API_KEY === "SUA_API_KEY") {
    console.error("ERRO: Por favor, substitua 'SUA_API_KEY' pela sua chave API real.");
    return;
  }

  const ai = new GoogleGenerativeAI(API_KEY);
  let hasFlashAccess = false;
  let hasProAccess = false;

  console.log("Iniciando a verificação de modelos...");

  try {
    // Lista de modelos para testar
    const modelsToTest = [
      'gemini-2.5-flash'
    ];

    console.log("\n✅ Testando quais modelos estão disponíveis:");

    for (const modelName of modelsToTest) {
      try {
        const model = ai.getGenerativeModel({ model: modelName });
        const result = await model.generateContent("test");
        console.log(`✓ ${modelName} - DISPONÍVEL`);

        if (modelName.includes("gemini-1.5-flash")) {
          hasFlashAccess = true;
        }
        if (modelName.includes("gemini-1.5-pro")) {
          hasProAccess = true;
        }
      } catch (err) {
        if (err.message && err.message.includes('404')) {
          console.log(`✗ ${modelName} - NÃO DISPONÍVEL (404)`);
        } else {
          console.log(`✗ ${modelName} - ERRO: ${err.message}`);
        }
      }
    }

    console.log("\n---");
    if (hasFlashAccess) {
      console.log("🎉 Conclusão: Você TEM acesso ao modelo 'gemini-1.5-flash'.");
    } else {
      console.log("⚠️ Conclusão: O modelo 'gemini-1.5-flash' NÃO foi encontrado na sua lista de acesso.");
    }

    if (hasProAccess) {
      console.log("🎉 Conclusão: Você TEM acesso ao modelo 'gemini-1.5-pro'.");
    } else {
      console.log("⚠️ Conclusão: O modelo 'gemini-1.5-pro' NÃO foi encontrado na sua lista de acesso.");
    }
  } catch (error) {
    console.error("\n❌ Erro ao listar modelos. Verifique se sua chave API é válida e se você tem acesso à API Generative AI.");
    console.error("Erro:", error.message);
  }
}

listAvailableModels();

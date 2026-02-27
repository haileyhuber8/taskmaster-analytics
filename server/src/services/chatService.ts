import { AzureOpenAI } from "openai";
import { DefaultAzureCredential, getBearerTokenProvider } from "@azure/identity";
import { ChatMessage } from "../types";
import { getDataSummary } from "./dataService";

function getClient(): AzureOpenAI {
  const credential = new DefaultAzureCredential();
  const azureADTokenProvider = getBearerTokenProvider(credential, "https://cognitiveservices.azure.com/.default");
  return new AzureOpenAI({
    endpoint: process.env.AZURE_OPENAI_ENDPOINT || "",
    azureADTokenProvider,
    apiVersion: "2024-08-01-preview",
    deployment: process.env.AZURE_OPENAI_DEPLOYMENT || "gpt-4o",
  });
}

const SYSTEM_PROMPT = `You are the Taskmaster's data analyst — a witty, knowledgeable assistant who speaks with the authority and dry humor of Greg Davies from Taskmaster UK. You have access to comprehensive data about Taskmaster UK contestants and their performance.

Your role:
- Answer questions about contestant performance, trends, and patterns
- Provide data-driven insights with specific numbers
- Be entertaining — channel Greg Davies' commanding presence and sardonic wit
- When comparing contestants, reference their actual stats
- If asked about data you don't have, say so honestly but stay in character

Keep responses concise but insightful. Use the data provided to back up your claims.

Here is the complete dataset you have access to:

`;

export async function chat(
  message: string,
  history: ChatMessage[]
): Promise<string> {
  const dataSummary = getDataSummary();

  const messages = [
    { role: "system" as const, content: SYSTEM_PROMPT + dataSummary },
    ...history.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
    { role: "user" as const, content: message },
  ];

  try {
    const client = getClient();

    const response = await client.chat.completions.create({
      model: process.env.AZURE_OPENAI_DEPLOYMENT || "gpt-4o",
      messages,
      temperature: 0.7,
      max_tokens: 1000,
    });

    return response.choices[0]?.message?.content || "The Taskmaster is speechless. Try again.";
  } catch (error: any) {
    console.error("Azure OpenAI error:", error.message);
    if (!process.env.AZURE_OPENAI_ENDPOINT) {
      return "The Taskmaster's communication device (Azure OpenAI) hasn't been configured yet. Set AZURE_OPENAI_ENDPOINT and AZURE_OPENAI_DEPLOYMENT environment variables.";
    }
    throw error;
  }
}

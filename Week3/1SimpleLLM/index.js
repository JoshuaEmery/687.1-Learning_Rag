import { config } from "dotenv";
config();
import { ChatOpenAI } from "@langchain/openai";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate } from "@langchain/core/prompts";

const parser = new StringOutputParser();

const model = new ChatOpenAI({ model: "gpt-3.5-turbo" });

import { HumanMessage, SystemMessage } from "@langchain/core/messages";

const messages = [
  new SystemMessage("Translate the following from English into Italian"),
  new HumanMessage("hi!"),
];

//The response from the model is an AIMessage. It contains the string response
//with other metadata
//await model.invoke(messages);
// const result = await model.invoke(messages);
// console.log(result);
// const contentResponse = await parser.invoke(result);
// console.log(contentResponse);

//it is possible to create a chain starting with the model and going to the parser
//const chain = model.pipe(parser);
//const contentResponse = await chain.invoke(messages);
//console.log(contentResponse);
//This is referred to as LangChain Expression Language LCEL
//LangChain Expression Language (LCEL)

//using a prompt template
const systemTemplate = "Translate the following into {language}:";
const promptTemplate = ChatPromptTemplate.fromMessages([
  ["system", systemTemplate],
  ["user", "{text}"],
]);
//const result = await promptTemplate.invoke({ language: "italian", text: "hi" });

//console.log(result);
//We can add this template to our chain
const chain = promptTemplate.pipe(model).pipe(parser);
const contentResponse = await chain.invoke({ language: "spanish", text: "hi" });
console.log(contentResponse);

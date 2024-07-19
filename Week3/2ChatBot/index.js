import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage } from "@langchain/core/messages";
import { AIMessage } from "@langchain/core/messages";
import { BaseMessage } from "@langchain/core/messages";
import {
  RunnablePassthrough,
  RunnableSequence,
} from "@langchain/core/runnables";
process.env.LANGCHAIN_CALLBACKS_BACKGROUND = true;

const model = new ChatOpenAI({
  model: "gpt-3.5-turbo",
  temperature: 0,
});
//In a chatbot we must maintain history
// const contentResponse = await model.invoke([
//   new HumanMessage({ content: "Hi! I'm Bob" }),
// ]);
// console.log(contentResponse.content);
//Here at this second response the LLM has no memory of what
//was asked previously.
// const secondResponse = await model.invoke([
//   new HumanMessage({ content: "What's my name?" }),
// ]);
// console.log(secondResponse.content);

//we can include previous messages from the AI in the request:
// const response = await model.invoke([
//   new HumanMessage({ content: "Hi! I'm Bob" }),
//   new AIMessage({ content: "Hello Bob! How can I assist you today?" }),
//   new HumanMessage({ content: "What's my name?" }),
// ]);

// console.log(response);

//to fix this program we can use a message history
// We use an ephemeral, in-memory chat history for this demo.
import { InMemoryChatMessageHistory } from "@langchain/core/chat_history";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RunnableWithMessageHistory } from "@langchain/core/runnables";

// const messageHistories = {};

const prompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `You are a helpful assistant who remembers all details the user shares with you.`,
  ],
  ["placeholder", "{chat_history}"],
  ["human", "{input}"],
]);

const filterMessages = ({ chat_history }) => {
  return chat_history.slice(-10);
};

const chain = RunnableSequence.from([
  RunnablePassthrough.assign({
    chat_history: filterMessages,
  }),
  prompt,
  model,
]);

// const withMessageHistory = new RunnableWithMessageHistory({
//   runnable: chain,
//   getMessageHistory: async (sessionId) => {
//     if (messageHistories[sessionId] === undefined) {
//       messageHistories[sessionId] = new InMemoryChatMessageHistory();
//     }
//     return messageHistories[sessionId];
//   },
//   inputMessagesKey: "input",
//   historyMessagesKey: "chat_history",
// });

// const config = {
//   configurable: {
//     sessionId: "abc2",
//   },
// };

// const response = await withMessageHistory.invoke(
//   {
//     input: "Hi! I'm Bob",
//   },
//   config
// );

// console.log(response);

// const followupResponse = await withMessageHistory.invoke(
//   {
//     input: "What's my name?",
//   },
//   config
// );

// console.log(followupResponse);

//we must manage the message history to avoid overflowing the content
//of the LLM
const messages = [
  new HumanMessage({ content: "hi! I'm bob" }),
  new AIMessage({ content: "hi!" }),
  new HumanMessage({ content: "I like vanilla ice cream" }),
  new AIMessage({ content: "nice" }),
  new HumanMessage({ content: "whats 2 + 2" }),
  new AIMessage({ content: "4" }),
  new HumanMessage({ content: "thanks" }),
  new AIMessage({ content: "No problem!" }),
  new HumanMessage({ content: "having fun?" }),
  new AIMessage({ content: "yes!" }),
  new HumanMessage({ content: "That's great!" }),
  new AIMessage({ content: "yes it is!" }),
];
// //we only remember 10 messages
// const response = await chain.invoke({
//   chat_history: messages,
//   input: "what's my name?",
// });
// //does not remember name
// console.log(response.content);

// //however it does remember ice cream:
// const response2 = await chain.invoke({
//   chat_history: messages,
//   input: "what's my fav ice cream",
// });
// console.log(response2.content);

const messageHistories = {};

//using runnablewithmessagehistory that uses the messages buy default
//still only 10 messages
const withMessageHistory = new RunnableWithMessageHistory({
  runnable: chain,
  getMessageHistory: async (sessionId) => {
    if (messageHistories[sessionId] === undefined) {
      const messageHistory = new InMemoryChatMessageHistory();
      await messageHistory.addMessages(messages);
      messageHistories[sessionId] = messageHistory;
    }
    return messageHistories[sessionId];
  },
  inputMessagesKey: "input",
  historyMessagesKey: "chat_history",
});

const config = {
  configurable: {
    sessionId: "abc4",
  },
};

const response = await withMessageHistory.invoke(
  {
    input: "whats my name?",
  },
  config
);

// console.log(response.content);

const response2 = await withMessageHistory.invoke(
  {
    input: "whats my favorite ice cream?",
  },
  config
);

// console.log(response2.content);

//streaming the response
const config3 = {
  configurable: {
    sessionId: "abc6",
  },
};

const stream = await withMessageHistory.stream(
  {
    input: "hi! I'm todd. tell me a joke",
  },
  config3
);

for await (const chunk of stream) {
  console.log("|", chunk.content);
}

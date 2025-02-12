import { TavilySearchResults } from "@langchain/community/tools/tavily_search";

const searchTool = new TavilySearchResults();

// const toolResult = await searchTool.invoke("what is the weather in SF?");

// console.log(toolResult);

/*
  [{"title":"Weather in December 2023 in San Francisco, California, USA","url":"https://www.timeanddate.com/weather/@5391959/historic?month=12&year=2023","content":"Currently: 52 °F. Broken clouds. (Weather station: San Francisco International Airport, USA). See more current weather Select month: December 2023 Weather in San Francisco — Graph °F Sun, Dec 17 Lo:55 6 pm Hi:57 4 Mon, Dec 18 Lo:54 12 am Hi:55 7 Lo:54 6 am Hi:55 10 Lo:57 12 pm Hi:64 9 Lo:63 6 pm Hi:64 14 Tue, Dec 19 Lo:61","score":0.96006},...]
*/
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { OpenAIEmbeddings } from "@langchain/openai";

const loader = new CheerioWebBaseLoader(
  "https://docs.smith.langchain.com/user_guide"
);
const rawDocs = await loader.load();

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 200,
});
const docs = await splitter.splitDocuments(rawDocs);

const vectorstore = await MemoryVectorStore.fromDocuments(
  docs,
  new OpenAIEmbeddings()
);
const retriever = vectorstore.asRetriever();

const retrieverResult = await retriever.invoke("how to upload a dataset");
console.log(retrieverResult[0]);

import { createRetrieverTool } from "langchain/tools/retriever";

const retrieverTool = createRetrieverTool(retriever, {
  name: "langsmith_search",
  description:
    "Search for information about LangSmith. For any questions about LangSmith, you must use this tool!",
});

const tools = [searchTool, retrieverTool];

import { ChatOpenAI } from "@langchain/openai";

const llm = new ChatOpenAI({
  model: "gpt-3.5-turbo",
  temperature: 0,
});

import { pull } from "langchain/hub";

// Get the prompt to use - you can modify this!
// If you want to see the prompt in full, you can at:
// https://smith.langchain.com/hub/hwchase17/openai-functions-agent
const prompt = await pull("hwchase17/openai-functions-agent");

import { createOpenAIFunctionsAgent } from "langchain/agents";

const agent = await createOpenAIFunctionsAgent({
  llm,
  tools,
  prompt,
});

import { AgentExecutor } from "langchain/agents";

const agentExecutor = new AgentExecutor({
  agent,
  tools,
});

const result1 = await agentExecutor.invoke({
  input: "hi!",
});

console.log(result1);
/*
    [chain/start] [1:chain:AgentExecutor] Entering Chain run with input: {
      "input": "hi!"
    }
    [chain/end] [1:chain:AgentExecutor] [1.36s] Exiting Chain run with output: {
      "output": "Hello! How can I assist you today?"
    }
    {
      input: 'hi!',
      output: 'Hello! How can I assist you today?'
    }
  */

const result2 = await agentExecutor.invoke({
  input: "how can langsmith help with testing?",
});

console.log(result2);

/*
        [chain/start] [1:chain:AgentExecutor] Entering Chain run with input: {
          "input": "how can langsmith help with testing?"
        }
        [chain/end] [1:chain:AgentExecutor > 2:chain:RunnableAgent > 7:parser:OpenAIFunctionsAgentOutputParser] [66ms] Exiting Chain run with output: {
          "tool": "langsmith_search",
          "toolInput": {
            "query": "how can LangSmith help with testing?"
          },
          "log": "Invoking \"langsmith_search\" with {\"query\":\"how can LangSmith help with testing?\"}\n",
          "messageLog": [
            {
              "lc": 1,
              "type": "constructor",
              "id": [
                "langchain_core",
                "messages",
                "AIMessage"
              ],
              "kwargs": {
                "content": "",
                "additional_kwargs": {
                  "function_call": {
                    "name": "langsmith_search",
                    "arguments": "{\"query\":\"how can LangSmith help with testing?\"}"
                  }
                }
              }
            }
          ]
        }
        [tool/start] [1:chain:AgentExecutor > 8:tool:langsmith_search] Entering Tool run with input: "{"query":"how can LangSmith help with testing?"}"
        [retriever/start] [1:chain:AgentExecutor > 8:tool:langsmith_search > 9:retriever:VectorStoreRetriever] Entering Retriever run with input: {
          "query": "how can LangSmith help with testing?"
        }
        [retriever/end] [1:chain:AgentExecutor > 8:tool:langsmith_search > 9:retriever:VectorStoreRetriever] [294ms] Exiting Retriever run with output: {
          "documents": [
            {
              "pageContent": "You can also quickly edit examples and add them to datasets to expand the surface area of your evaluation sets or to fine-tune a model for improved quality or reduced costs.Monitoring​After all this, your app might finally ready to go in production. LangSmith can also be used to monitor your application in much the same way that you used for debugging. You can log all traces, visualize latency and token usage statistics, and troubleshoot specific issues as they arise. Each run can also be assigned string tags or key-value metadata, allowing you to attach correlation ids or AB test variants, and filter runs accordingly.We’ve also made it possible to associate feedback programmatically with runs. This means that if your application has a thumbs up/down button on it, you can use that to log feedback back to LangSmith. This can be used to track performance over time and pinpoint under performing data points, which you can subsequently add to a dataset for future testing — mirroring the",
              "metadata": {
                "source": "https://docs.smith.langchain.com/user_guide",
                "loc": {
                  "lines": {
                    "from": 11,
                    "to": 11
                  }
                }
              }
            },
            {
              "pageContent": "the time that we do… it’s so helpful. We can use LangSmith to debug:An unexpected end resultWhy an agent is loopingWhy a chain was slower than expectedHow many tokens an agent usedDebugging​Debugging LLMs, chains, and agents can be tough. LangSmith helps solve the following pain points:What was the exact input to the LLM?​LLM calls are often tricky and non-deterministic. The inputs/outputs may seem straightforward, given they are technically string → string (or chat messages → chat message), but this can be misleading as the input string is usually constructed from a combination of user input and auxiliary functions.Most inputs to an LLM call are a combination of some type of fixed template along with input variables. These input variables could come directly from user input or from an auxiliary function (like retrieval). By the time these input variables go into the LLM they will have been converted to a string format, but often times they are not naturally represented as a string",
              "metadata": {
                "source": "https://docs.smith.langchain.com/user_guide",
                "loc": {
                  "lines": {
                    "from": 3,
                    "to": 3
                  }
                }
              }
            },
            {
              "pageContent": "inputs, and see what happens. At some point though, our application is performing\nwell and we want to be more rigorous about testing changes. We can use a dataset\nthat we’ve constructed along the way (see above). Alternatively, we could spend some\ntime constructing a small dataset by hand. For these situations, LangSmith simplifies",
              "metadata": {
                "source": "https://docs.smith.langchain.com/user_guide",
                "loc": {
                  "lines": {
                    "from": 4,
                    "to": 7
                  }
                }
              }
            },
            {
              "pageContent": "feedback back to LangSmith. This can be used to track performance over time and pinpoint under performing data points, which you can subsequently add to a dataset for future testing — mirroring the debug mode approach.We’ve provided several examples in the LangSmith documentation for extracting insights from logged runs. In addition to guiding you on performing this task yourself, we also provide examples of integrating with third parties for this purpose. We're eager to expand this area in the coming months! If you have ideas for either -- an open-source way to evaluate, or are building a company that wants to do analytics over these runs, please reach out.Exporting datasets​LangSmith makes it easy to curate datasets. However, these aren’t just useful inside LangSmith; they can be exported for use in other contexts. Notable applications include exporting for use in OpenAI Evals or fine-tuning, such as with FireworksAI.To set up tracing in Deno, web browsers, or other runtime",
              "metadata": {
                "source": "https://docs.smith.langchain.com/user_guide",
                "loc": {
                  "lines": {
                    "from": 11,
                    "to": 11
                  }
                }
              }
            }
          ]
        }
        [chain/start] [1:chain:AgentExecutor > 10:chain:RunnableAgent] Entering Chain run with input: {
          "input": "how can langsmith help with testing?",
          "steps": [
            {
              "action": {
                "tool": "langsmith_search",
                "toolInput": {
                  "query": "how can LangSmith help with testing?"
                },
                "log": "Invoking \"langsmith_search\" with {\"query\":\"how can LangSmith help with testing?\"}\n",
                "messageLog": [
                  {
                    "lc": 1,
                    "type": "constructor",
                    "id": [
                      "langchain_core",
                      "messages",
                      "AIMessage"
                    ],
                    "kwargs": {
                      "content": "",
                      "additional_kwargs": {
                        "function_call": {
                          "name": "langsmith_search",
                          "arguments": "{\"query\":\"how can LangSmith help with testing?\"}"
                        }
                      }
                    }
                  }
                ]
              },
              "observation": "You can also quickly edit examples and add them to datasets to expand the surface area of your evaluation sets or to fine-tune a model for improved quality or reduced costs.Monitoring​After all this, your app might finally ready to go in production. LangSmith can also be used to monitor your application in much the same way that you used for debugging. You can log all traces, visualize latency and token usage statistics, and troubleshoot specific issues as they arise. Each run can also be assigned string tags or key-value metadata, allowing you to attach correlation ids or AB test variants, and filter runs accordingly.We’ve also made it possible to associate feedback programmatically with runs. This means that if your application has a thumbs up/down button on it, you can use that to log feedback back to LangSmith. This can be used to track performance over time and pinpoint under performing data points, which you can subsequently add to a dataset for future testing — mirroring the\n\nthe time that we do… it’s so helpful. We can use LangSmith to debug:An unexpected end resultWhy an agent is loopingWhy a chain was slower than expectedHow many tokens an agent usedDebugging​Debugging LLMs, chains, and agents can be tough. LangSmith helps solve the following pain points:What was the exact input to the LLM?​LLM calls are often tricky and non-deterministic. The inputs/outputs may seem straightforward, given they are technically string → string (or chat messages → chat message), but this can be misleading as the input string is usually constructed from a combination of user input and auxiliary functions.Most inputs to an LLM call are a combination of some type of fixed template along with input variables. These input variables could come directly from user input or from an auxiliary function (like retrieval). By the time these input variables go into the LLM they will have been converted to a string format, but often times they are not naturally represented as a string\n\ninputs, and see what happens. At some point though, our application is performing\nwell and we want to be more rigorous about testing changes. We can use a dataset\nthat we’ve constructed along the way (see above). Alternatively, we could spend some\ntime constructing a small dataset by hand. For these situations, LangSmith simplifies\n\nfeedback back to LangSmith. This can be used to track performance over time and pinpoint under performing data points, which you can subsequently add to a dataset for future testing — mirroring the debug mode approach.We’ve provided several examples in the LangSmith documentation for extracting insights from logged runs. In addition to guiding you on performing this task yourself, we also provide examples of integrating with third parties for this purpose. We're eager to expand this area in the coming months! If you have ideas for either -- an open-source way to evaluate, or are building a company that wants to do analytics over these runs, please reach out.Exporting datasets​LangSmith makes it easy to curate datasets. However, these aren’t just useful inside LangSmith; they can be exported for use in other contexts. Notable applications include exporting for use in OpenAI Evals or fine-tuning, such as with FireworksAI.To set up tracing in Deno, web browsers, or other runtime"
            }
          ]
        }
        [chain/end] [1:chain:AgentExecutor] [5.83s] Exiting Chain run with output: {
          "input": "how can langsmith help with testing?",
          "output": "LangSmith can help with testing in several ways:\n\n1. Debugging: LangSmith can be used to debug unexpected end results, agent loops, slow chains, and token usage. It helps in pinpointing underperforming data points and tracking performance over time.\n\n2. Monitoring: LangSmith can monitor applications by logging all traces, visualizing latency and token usage statistics, and troubleshooting specific issues as they arise. It also allows for associating feedback programmatically with runs, which can be used to track performance over time.\n\n3. Exporting Datasets: LangSmith makes it easy to curate datasets, which can be exported for use in other contexts such as OpenAI Evals or fine-tuning with FireworksAI.\n\nOverall, LangSmith simplifies the process of testing changes, constructing datasets, and extracting insights from logged runs, making it a valuable tool for testing and evaluation."
        }
        {
          input: 'how can langsmith help with testing?',
          output: 'LangSmith can help with testing in several ways:\n' +
            '\n' +
            '1. Initial Test Set: LangSmith allows developers to create datasets of inputs and reference outputs to run tests on their LLM applications. These test cases can be uploaded in bulk, created on the fly, or exported from application traces.\n' +
            '\n' +
            "2. Comparison View: When making changes to your applications, LangSmith provides a comparison view to see whether you've regressed with respect to your initial test cases. This is helpful for evaluating changes in prompts, retrieval strategies, or model choices.\n" +
            '\n' +
            '3. Monitoring and A/B Testing: LangSmith provides monitoring charts to track key metrics over time and allows for A/B testing changes in prompt, model, or retrieval strategy.\n' +
            '\n' +
            '4. Debugging: LangSmith offers tracing and debugging information at each step of an LLM sequence, making it easier to identify and root-cause issues when things go wrong.\n' +
            '\n' +
            '5. Beta Testing and Production: LangSmith enables the addition of runs as examples to datasets, expanding test coverage on real-world scenarios. It also provides monitoring for application performance with respect to latency, cost, and feedback scores at the production stage.\n' +
            '\n' +
            'Overall, LangSmith provides comprehensive testing and monitoring capabilities for LLM applications.'
        }
      */
// Adding in memory
const result3 = await agentExecutor.invoke({
  input: "hi! my name is cob.",
  chat_history: [],
});

console.log(result3);
/*
    {
      input: 'hi! my name is cob.',
      chat_history: [],
      output: "Hello Cob! It's nice to meet you. How can I assist you today?"
    }
  */

import { HumanMessage, AIMessage } from "@langchain/core/messages";

const result4 = await agentExecutor.invoke({
  input: "what's my name?",
  chat_history: [
    new HumanMessage("hi! my name is cob."),
    new AIMessage("Hello Cob! How can I assist you today?"),
  ],
});

console.log(result4);
/*
      {
        input: "what's my name?",
        chat_history: [
          HumanMessage {
            content: 'hi! my name is cob.',
            additional_kwargs: {}
          },
          AIMessage {
            content: 'Hello Cob! How can I assist you today?',
            additional_kwargs: {}
          }
        ],
        output: 'Your name is Cob. How can I assist you today, Cob?'
      }
    */
import { ChatMessageHistory } from "langchain/stores/message/in_memory";
import { RunnableWithMessageHistory } from "@langchain/core/runnables";

const messageHistory = new ChatMessageHistory();

const agentWithChatHistory = new RunnableWithMessageHistory({
  runnable: agentExecutor,
  // This is needed because in most real world scenarios, a session id is needed per user.
  // It isn't really used here because we are using a simple in memory ChatMessageHistory.
  getMessageHistory: (_sessionId) => messageHistory,
  inputMessagesKey: "input",
  historyMessagesKey: "chat_history",
});

const result5 = await agentWithChatHistory.invoke(
  {
    input: "hi! i'm cob",
  },
  {
    // This is needed because in most real world scenarios, a session id is needed per user.
    // It isn't really used here because we are using a simple in memory ChatMessageHistory.
    configurable: {
      sessionId: "foo",
    },
  }
);

console.log(result5);
/*
        {
          input: "hi! i'm cob",
          chat_history: [
            HumanMessage {
              content: "hi! i'm cob",
              additional_kwargs: {}
            },
            AIMessage {
              content: 'Hello Cob! How can I assist you today?',
              additional_kwargs: {}
            }
          ],
          output: 'Hello Cob! How can I assist you today?'
        }
      */
const result6 = await agentWithChatHistory.invoke(
  {
    input: "what's my name?",
  },
  {
    // This is needed because in most real world scenarios, a session id is needed per user.
    // It isn't really used here because we are using a simple in memory ChatMessageHistory.
    configurable: {
      sessionId: "foo",
    },
  }
);

console.log(result6);
/*
            {
              input: "what's my name?",
              chat_history: [
                HumanMessage {
                  content: "hi! i'm cob",
                  additional_kwargs: {}
                },
                AIMessage {
                  content: 'Hello Cob! How can I assist you today?',
                  additional_kwargs: {}
                },
                HumanMessage {
                  content: "what's my name?",
                  additional_kwargs: {}
                },
                AIMessage {
                  content: 'Your name is Cob. How can I assist you today, Cob?',
                  additional_kwargs: {}
                }
              ],
              output: 'Your name is Cob. How can I assist you today, Cob?'
            }
          */

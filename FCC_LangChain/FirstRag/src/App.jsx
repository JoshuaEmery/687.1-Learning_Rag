import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { createClient } from "@supabase/supabase-js";
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { OpenAIEmbeddings } from "@langchain/openai";
import { ChatOpenAI } from "@langchain/chat_models/openai";
import {} from "@langchain/prompts";

function App() {
  const sbApiKey = import.meta.env.VITE_SUPABASE_APIKEY;
  const sbUrl = import.meta.env.VITE_SUPABASE_URL;
  const openAIKey = import.meta.env.VITE_OPENAI_APIKEY;
  async function loadData() {
    try {
      const result = await fetch("scrimba-info.txt");
      const text = await result.text();
      //seperators is an array of strings that will be used to split the text
      //default is ['\n\n', '\n', ' ', '']
      //these settings are not an exact science you must play with them
      //to get the best fit for your document
      const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 500,
        //splits text based on size but prioritizes the separators
        separators: ["\n\n", "\n", " ", ""],
        //overlapping is including characters from the previous chunk in the next chunk
        chunkOverlap: 50,
      });
      const output = await splitter.createDocuments([text]);
      console.log(output);
      //create the supabase vector store with embeddings
      const client = createClient(sbUrl, sbApiKey);
      //insert the embeddings into the store
      await SupabaseVectorStore.fromDocuments(
        output,
        new OpenAIEmbeddings({ openAIApiKey: openAIKey }),
        {
          client: client,
          tableName: "documents",
        }
      );
    } catch (err) {
      console.log(err);
    }
  }
  //loadData();
  const [count, setCount] = useState(0);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");

  return (
    <>
      <div>
        <label htmlFor="">Ask a Question: </label>
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          type="text"
        />
        <button>Ask Question</button>
      </div>
      <div>
        <p></p>
      </div>
    </>
  );
}

export default App;

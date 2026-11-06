import express from "express";
import { ChatGroq } from "@langchain/groq";
import dotenv from "dotenv"
import { MemorySaver, MessagesAnnotation, StateGraph } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { TavilySearch } from "@langchain/tavily";

dotenv.config();

const app = express();

app.use(express.json());

const tool = new TavilySearch({
    maxResults: 5,
    topic: "general",
});

const checkPointer = new MemorySaver();

const tools = [tool];
const toolNode = new ToolNode(tools);

const llm = new ChatGroq({
    model: "openai/gpt-oss-120b",
    temperature: 0,
}).bindTools(tools);


const callLLM = async (state) => {
    const response = await llm.invoke([
        {
            role: "system",
            content: `You are Jarvis, a helpful AI assistant.
            If you dont know the answer then call relevant tool
            or you can use Tavily for current and latest information.`
        },
        ...state.messages
    ]);

    return { messages: [response] };
};


const shouldContinue = (state) => {
    const lastMessage = state.messages[state.messages.length - 1];

    if (lastMessage.tool_calls?.length > 0) {
        return "tools";
    }

    return "__end__";
};


const graph = new StateGraph(MessagesAnnotation)
    .addNode("agent", callLLM)
    .addNode("tools", toolNode)
    .addEdge("__start__", "agent")
    .addEdge("tools", "agent")
    .addConditionalEdges("agent", shouldContinue)
    .compile({ checkpointer: checkPointer }); 




app.post("/ai", async (req, res) => {
    const { input } = req.body

    const response = await graph.invoke({
        messages: [
            {
                role: "user",
                content: input
            }
        ]
    }, 
    {configurable: {thread_id: "user123"}}    
)

    return res.status(200).json({
        "ai": response.messages[response.messages.length - 1].content
    }) 

})

app.listen(3000, () => {
    console.log("Server is running on port 3000...");
})
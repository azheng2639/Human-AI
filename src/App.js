import React, { useState, useRef, useEffect } from "react";
import userProfilePic from './assets/human.png';
import botProfilePic from './assets/bot.png';
import CsvFileInput from "./components/CsvFileImport";
import { VegaLite } from 'react-vega';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { BouncingBall } from 'react-svg-spinners';

const url = process.env.NODE_ENV === 'development' ? 'http://127.0.0.1:8000/' : 'https://human-ai.onrender.com/';

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [csv_data, setData] = useState([]);
  const [loading, setLoading] = useState(false); // State to manage loading state
  const [showDataPreview, setShowDataPreview] = useState(false); // State to manage data preview visibility
  const chatContainerRef = useRef(null); // Create a reference to the chat container

  const handleFileLoad = (csvFile) => {
    setData(csvFile);
    setShowDataPreview(true);
  };

  const sendMessage = async () => {
    if (input.trim()) {
      const userMessage = { sender: "user", text: input };
      setMessages((prevMessages) => [...prevMessages, userMessage]);
      setLoading(true);
      setInput("");
      BotResponse(input);
    }
  };

  const handleInputChange = (e) => setInput(e.target.value);

  const clearChat = () => {
    setMessages([]);
  };

  function extractKeys(arr, keys) {
    return arr.map(obj => {
      let result = {};
      keys.forEach(key => {
        if (obj[key] !== undefined) {
          result[key] = obj[key];
        }
      });
      return result;
    });
  }

  const BotResponse = async (message) => {
    const prompt = typeof message === "string" ? message : JSON.stringify(message);
    if (prompt === "") {
      return;
    }

    fetch(`${url}query`, {
      method: "POST",
      body: JSON.stringify({ prompt: prompt, csv_data: JSON.stringify(csv_data.slice(0, 10)) }),
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => response.json())
      .then((data) => {
        setLoading(false);
        try {
          const col = Object.keys(JSON.parse(data.vega_lite_json).data.values[0])
          const full_data = extractKeys(csv_data, col)
          const d = JSON.parse(data.vega_lite_json)
          d.data.values = full_data
          const botMessage = { sender: "bot", text: data.response, spec: d };
          setMessages((prevMessages) => [...prevMessages, botMessage]);
        }
        catch (error) {
          const botMessage = { sender: "bot", text: data.response, spec: null };
          setMessages((prevMessages) => [...prevMessages, botMessage]);
        }
      });
  };

  const previewData = () => {
    if (csv_data.length === 0) return null;

    const headers = Object.keys(csv_data[0]);
    const previewRows = csv_data.slice(0, 10);

    return (
      <div className="overflow-x-auto w-full">
        <table className="table-auto w-full border-collapse border border-gray-300 my-4">
          <thead>
            <tr>
              {headers.map((header, index) => (
                <th key={index} className="border border-gray-400 p-2 bg-gray-100 whitespace-nowrap">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {previewRows.map((row, index) => (
              <tr key={index}>
                {headers.map((header, headerIndex) => (
                  <td key={headerIndex} className="border border-gray-400 p-2 whitespace-nowrap">
                    {row[header] || ""}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const toggleDataPreview = () => {
    setShowDataPreview((prevShowDataPreview) => !prevShowDataPreview);
  };

  return (
    <div className="flex flex-col items-center h-screen p-6">
      <div className="flex-grow flex flex-col w-full max-w-4xl bg-white rounded-lg shadow-md p-6">
        <h1 className="text-4xl font-bold text-center mb-4 text-gray-800">CSVis</h1>
        <div className="flex-grow flex flex-col bg-gray-50 rounded-lg p-4 mt-3">
          <CsvFileInput onFileLoad={handleFileLoad} />
          <button
            onClick={toggleDataPreview}
            className="bg-blue-600 text-white rounded-lg mt-3 px-4 py-2 hover:bg-blue-700 transition duration-300"
          >
            {showDataPreview ? "Hide Data Preview" : "Show Data Preview"}
          </button>
          {showDataPreview && previewData()}
          <div ref={chatContainerRef} className="h-[36rem] overflow-y-auto bg-white rounded-lg p-4 mt-3 mb-4 shadow-inner">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex items-start my-2 ${
                  message.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {message.sender === "bot" && (
                  <img
                    src={botProfilePic}
                    alt="Bot Avatar"
                    className="w-10 h-10 rounded-full mr-3"
                  />
                )}
                <div
                  className={`${
                    message.sender === "user"
                      ? "bg-purple-500 text-white"
                      : "bg-gray-200 text-black"
                  } rounded-lg p-3 `}
                >
                  <Markdown remarkPlugins={[remarkGfm]}>{message.text}</Markdown>
                  {message.spec && (
                    <div className="w-full my-4">
                      <VegaLite spec={message.spec} />
                    </div>
                  )}
                </div>
                {message.sender === "user" && (
                  <img
                    src={userProfilePic}
                    alt="User Avatar"
                    className="w-10 h-10 rounded-full ml-3"
                  />
                )}
              </div>
            ))}
            {loading && (
              <div className="flex justify-center items-center my-4">
                <BouncingBall width="40" height="40" color="#4A90E2" />
              </div>
            )}
          </div>
        </div>
        <div className="flex mt-3">
          <input
            type="text"
            placeholder="Enter your message"
            className="flex-grow border border-gray-300 rounded-lg p-4 bg-white shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={input}
            onChange={handleInputChange}
            onKeyPress={(e) => e.key === "Enter" && sendMessage()}
          />
          <button
            onClick={sendMessage}
            className="bg-purple-500 text-white rounded-lg ml-2 px-6 py-2 hover:bg-purple-600 transition duration-300"
          >
            Send
          </button>
          <button
            onClick={clearChat}
            className="bg-red-500 text-white rounded-lg ml-2 px-6 py-2 hover:bg-red-600 transition duration-300"
          >
            Clear Messages
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
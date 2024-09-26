import React, { useState } from "react";
import userProfilePic from './assets/human.png';
import botProfilePic from './assets/bot.png';
import CsvFileInput from "./components/CsvFileImport";
import { VegaLite } from 'react-vega';

const url = process.env.NODE_ENV === 'development' ? 'http://127.0.0.1:8000/': 'https://human-ai.onrender.com/';

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [csv_data, setData] = useState([]);

  const handleFileLoad = (csvFile) => {
    setData(csvFile);
  };

  const sendMessage = async () => {
    if (input.trim()) {
      const userMessage = { sender: "user", text: input };
      setMessages((prevMessages) => [...prevMessages, userMessage]);
      setInput("");
      BotResponse(input);
    }
  };

  const handleInputChange = (e) => setInput(e.target.value);

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
      body: JSON.stringify({ prompt: prompt, csv_data: JSON.stringify(csv_data.slice(0,10))}),
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => response.json())
      .then((data) => {
        try {
          const col = Object.keys(JSON.parse(data.vega_lite_json).data.values[0])
          const full_data = extractKeys(csv_data, col)
          const d = JSON.parse(data.vega_lite_json)
          d.data.values = full_data
          const botMessage = { sender: "bot", text: data.response, spec: d};
          setMessages((prevMessages) => [...prevMessages, botMessage]);
        }
        catch (error) {
          const botMessage = { sender: "bot", text: data.response, spec: null};
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
  

  return (
    <div className="flex flex-col items-center h-screen bg-blue p-6">
      <div className="flex flex-col w-full max-w-4xl flex flex-col bg-blue rounded-lg shadow-md p-6 h-full">
        <h1 className="text-5xl font-bold text-center mb-5">AI Assistant</h1>
        <div className="flex-grow flex flex-col bg-white rounded-lg p-4 mt-4">
          <CsvFileInput onFileLoad={handleFileLoad} />
          {previewData()}
          <div className="h-96 overflow-y-auto bg-gray-100 rounded-lg p-4 mb-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex items-start my-1 ${
                  message.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {message.sender === "bot" && (
                  <img
                    src={botProfilePic}
                    alt="Bot Avatar"
                    className="w-8 h-8 rounded-full mr-2"
                  />
                  
                )}
                
                <div
                  className={`${
                    message.sender === "user"
                      ? "bg-purple-500 text-white"
                      : "bg-gray-300 text-black"
                  } rounded-lg p-2`}
                >
                  {message.text}
                  
                  <div className="w-full my-4">
                    <VegaLite spec={message.spec}/>
                  </div>
                
                </div>
                {message.sender === "user" && (
                  <img
                    src={userProfilePic}
                    alt="User Avatar"
                    className="w-8 h-8 rounded-full ml-2"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="flex mt-4">
          <input
            type="text"
            placeholder="Enter your message"
            className="flex-grow border border-gray-300 rounded-lg p-4 bg-white shadow-md"
            value={input}
            onChange={handleInputChange}
            onKeyPress={(e) => e.key === "Enter" && sendMessage()}
          />
          <button
            onClick={sendMessage}
            className="bg-purple-500 text-white rounded-lg ml-2 px-6 py-2"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;

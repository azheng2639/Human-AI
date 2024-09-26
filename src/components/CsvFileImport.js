import React, { useState } from "react";
import * as d3 from 'd3';

const CsvFileInput = ({ onFileLoad }) => {
  const [dragging, setDragging] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type === "text/csv") {
      parseCSV(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => {
    setDragging(false);
  };

  const parseCSV = (file) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const csvData = event.target.result;
      const parsedData = d3.csvParse(csvData);
      onFileLoad(parsedData);
    };
    reader.readAsText(file);
  };

  return (
    <div
      className={`border-dashed border-2 p-4 ${dragging ? 'border-blue-500' : 'border-gray-400'}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <p className="text-center text-gray-500">Drag and drop a CSV file here</p>
      <input
        type="file"
        accept=".csv"
        onChange={(e) => parseCSV(e.target.files[0])}
        className="hidden"
      />
    </div>
  );
};

export default CsvFileInput;

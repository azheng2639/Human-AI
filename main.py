import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from openai import OpenAI
import pandas as pd
from typing import Optional
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import json

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust this to restrict allowed origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load OpenAI API key from environment variable
client = OpenAI(
    # This is the default and can be omitted
    api_key=os.environ.get("OPENAI_API_KEY"),
)

# Define request and response models
class QueryRequest(BaseModel):
    prompt: str
    csv_data: str

class QueryResponse(BaseModel):
    response: str
    vega_lite_json: Optional[str]


@app.post("/query", response_model=QueryResponse)
async def query_openai(request: QueryRequest):
    df = pd.DataFrame(json.loads(request.csv_data))
    if df.empty:
        return QueryResponse(response="Please provide a prompt and CSV data.", vega_lite_json="")

    columns = df.columns.tolist()
    
    column_identification_prompt = f"Given the following columns: {columns}, identify the relevant columns for the following prompt: {request.prompt}. Do not give an explanation, just list the columns separated by commas."
    try:
        column_response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are an AI assistant that specializes in understanding datasets."},
                {"role": "user", "content": column_identification_prompt}
            ],

        )
        relevant_columns = column_response.choices[0].message.content.strip().split(',')
        relevant_columns = [col.strip() for col in relevant_columns]

        trimmed_df = df[relevant_columns]
        trimmed_csv_data = trimmed_df.to_csv(index=False)

        vega_lite_prompt = f"Generate a Vega-Lite JSON specification for the following data: {trimmed_csv_data} based on the prompt: {request.prompt}. "
        
        system_prompt = f"""You are an AI assistant designed to generate vega-lite specifications. It is imperative that it follows this general format: {{
            "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
            width: 400,
            height: 200,
            "mark": "bar",
            "data": {{
            "values": [
            {{"category":"A", "group": "x", "value":0.1}},
            {{"category":"A", "group": "y", "value":0.6}},
            {{"category":"A", "group": "z", "value":0.9}},
            {{"category":"B", "group": "x", "value":0.7}},
            {{"category":"B", "group": "y", "value":0.2}},
            {{"category":"B", "group": "z", "value":1.1}},
            {{"category":"C", "group": "x", "value":0.6}},
            {{"category":"C", "group": "y", "value":0.1}},
            {{"category":"C", "group": "z", "value":0.2}}
            ]
            }},
            "encoding": {{
            "x": {{"field": "category"}},
            "y": {{"field": "value", "type": "quantitative"}},
            "xOffset": {{"field": "group"}},
            "color": {{"field": "group"}}
            }}
        }}
        
        You must include the schema, the data, and the mark field. The encoding should include the correct fields and types.
        The user may ask you questions that dont involve the data, but you should ignore them and focus on the data and return an empty vega-lite JSON specification as well as an explanantion.
        You will talk about the data and store it as the variable response, and the vega-lite JSON specification as the variable vega_lite_json.
        """

        response = client.beta.chat.completions.parse(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": vega_lite_prompt}
            ],

            response_format=QueryResponse
        )
        if ("mark" not in response.choices[0].message.parsed.vega_lite_json):
            return QueryResponse(response="There was an issue generating the visualization, please try again", vega_lite_json="")
        return QueryResponse(response=response.choices[0].message.parsed.response, vega_lite_json=response.choices[0].message.parsed.vega_lite_json)
    except Exception as e:
        print(e)
        if type(e) is KeyError:
            return QueryResponse(response="Please provide a relevant prompt, thank you", vega_lite_json="")
        return QueryResponse(response="An error occurred. Please try again", vega_lite_json="")
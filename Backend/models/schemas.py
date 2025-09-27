from pydantic import BaseModel

class Message(BaseModel):
    text: str
    session_id: str

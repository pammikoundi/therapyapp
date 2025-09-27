from pydantic import BaseModel
from typing import Optional
from enum import Enum


class MessageRole(str, Enum):
    user = "user"
    generated = "generated"

class Message(BaseModel):
    text: str
    session_id: str
    role: Optional[MessageRole] = MessageRole.user

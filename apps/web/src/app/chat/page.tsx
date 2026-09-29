"use client";
import { FormEvent, useState } from "react";

export default function ChatPage() {
  const [message, setMessage] = useState("");
  const [answer, setAnswer] = useState("");
  async function submit(e: FormEvent) {
    e.preventDefault();
    const api = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
    const res = await fetch(`${api}/api/v1/chat`, {
      method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({message})
    });
    const data = await res.json();
    setAnswer(data.answer);
  }
  return <main><h1>Tư vấn tuyển sinh</h1><form onSubmit={submit} className="card"><textarea value={message} onChange={e=>setMessage(e.target.value)} rows={5} style={{width:"100%"}}/><button type="submit">Gửi</button></form>{answer && <div className="card">{answer}</div>}</main>;
}

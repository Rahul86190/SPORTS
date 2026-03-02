"use client";
import { useEffect, useState } from "react";

export default function APITest() {
    const [status, setStatus] = useState("Waiting...");

    useEffect(() => {
        const fetchIt = async () => {
            try {
                const res = await fetch("http://localhost:8000/api/resume/history?user_id=f6c7ecf4-5d4d-491c-87f6-a9543725c311");
                const text = await res.text();
                setStatus(`Status: ${res.status}. Data: ${text}`);
            } catch (e: any) {
                setStatus(`Error: ${e.message}`);
            }
        };
        fetchIt();
    }, []);

    return (
        <div style={{ position: "fixed", top: 0, left: 0, zIndex: 9999, background: "yellow", padding: "10px", color: "black", fontWeight: "bold" }}>
            API TEST PING: {status}
        </div>
    );
}

import React, { useRef ,useState } from "react";
import ReactMarkdown from "react-markdown";
import {
  Tldraw,
  getSnapshot,
  loadSnapshot,
  renderPlaintextFromRichText,
} from "tldraw";
import "tldraw/tldraw.css";
import "./App.css";
import "tailwindcss";
import { Toaster, toast } from "react-hot-toast";
import { supabase } from "./lib/supabase";


const params = new URLSearchParams(window.location.search);

let boardId = params.get("board");
const clientId = crypto.randomUUID();

if (!boardId) {
  boardId = crypto.randomUUID();

  window.history.replaceState(
    {},
    "",
    `?board=${boardId}`
  );
}

function App() {
  const editorRef = useRef(null);
  const timeoutRef = useRef(null);
  const isSyncingRef = useRef(false);
  const hasSubscribedRef = useRef(false);

  const handleShare = async () => {
  try {
    await navigator.clipboard.writeText(window.location.href);
    toast.success("Share link copied!");
  } catch (err) {
    toast.error("Failed to copy link.");
  }
};

  const handleSave = async () => {
    if (!editorRef.current || isSyncingRef.current) return;

    const snapshot = getSnapshot(editorRef.current.store);

    const { error } = await supabase
      .from("boards")
      .upsert(
        {
          id: boardId,
          snapshot,
          client_id: clientId,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "id",
        }
      );
      console.log("Saving board:", boardId);
    if (error) {

      console.error(error);
      toast.error("Save failed");
      return;
    }

    console.log("Saved");
  };

  const handleLoad = async () => {
    if (!editorRef.current) return;

    isSyncingRef.current = true;

    const { data, error } = await supabase
      .from("boards")
      .select("snapshot")
      .eq("id", boardId)
      .single();

    if (!error && data) {
      loadSnapshot(editorRef.current.store, data.snapshot);
    }

    isSyncingRef.current = false;
  };

  // basically we are notifing other clients that something is updated in board , u also update (without refreshing)
  const subscribeToBoard = () => {
    // supabase.removeAllChannels();
    supabase
      .channel(`board-${boardId}`) // created communication channel

      .on(
        "postgres_changes",
        {
          event:"UPDATE",
          schema:"public",
          table:"boards",
          filter: `id=eq.${boardId}`, 
        },
        (payload) => {
          if (!editorRef.current) return;
          if (isSyncingRef.current) return;

          if (payload.new.client_id === clientId) return;

          isSyncingRef.current = true;

          loadSnapshot(editorRef.current.store, payload.new.snapshot);

          setTimeout(() => {
           isSyncingRef.current = false;
          }, 100);
        }
      )
      .subscribe((status) => {
      console.log("Realtime status:", status);
    });
  }

const isPopup = window.innerWidth <= 820 && window.innerHeight <= 620;

const [summary, setSummary] = useState("");
const [loading, setLoading] = useState(false);

const handleAISummary = async () => {
  if (!editorRef.current) return;

  setLoading(true);

  try {

    const richTextTypes = new Set(["text", "note", "geo", "arrow"]);

const notes = editorRef.current
  .getCurrentPageShapes()
  .filter(
    (shape) =>
      richTextTypes.has(shape.type) && shape.props.richText
  )
  .map((shape) =>
    renderPlaintextFromRichText(
      editorRef.current,
      shape.props.richText
    )
  )
  .filter(Boolean)
  .join("\n");

    if (!notes.trim()) {
      toast.error("No text found on board.");
      setLoading(false);
      return;
    }

    const response = await fetch("/api/summarize", {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        notes,
      }),
    });

    const data = await response.json();

    setSummary(data.summary);

  } catch (err) {
  console.error("Frontend Error:", err);
  toast.error("AI failed.");
}

  setLoading(false);
};

  return (
    <>
      <Toaster position="bottom-center" />

      <div className="app">
      {!isPopup && (
        <><button
            onClick={handleShare}
            className="fixed top-25 left-4 z-50 rounded-xl bg-white px-4 py-2 text-sm font-medium text-gray-800 shadow-lg ring-1 ring-gray-200 transition hover:bg-gray-100"
          >
            🔗 Share
          </button><button
            onClick={handleAISummary}
            className="fixed top-15 left-4 z-50 rounded-xl bg-white px-4 py-2 text-sm font-medium text-gray-800 shadow-lg ring-1 ring-gray-200 transition hover:bg-gray-100"
          >
              ✨ AI Notes
            </button></>
      )}
      
        <Tldraw licenseKey={import.meta.env.VITE_TLDRAW_LICENSE_KEY}
          onMount={(editor) => {
            console.log("🔥 ONMOUNT");
            editorRef.current = editor;

            handleLoad();
            console.log("Before subscribe");
            if (!hasSubscribedRef.current) {
             hasSubscribedRef.current = true;
             subscribeToBoard();
            }

            console.log("After subscribe");

            editor.store.listen(
              () => {
                if (isSyncingRef.current) return;

                clearTimeout(timeoutRef.current);

                timeoutRef.current = setTimeout(() => {
                  
                  handleSave();
                  console.log("Calling handleSave");
                }, 300);
              },
              {
                source: "user",
                scope: "document",
              }
            );
          }}
        />
        {
summary && (

<div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">

    <div className="bg-white rounded-xl p-6 w-[550px] max-h-[70vh] overflow-y-auto shadow-xl">

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">
          ✨ AI Notes
        </h2>

        <button
          onClick={() => {
            navigator.clipboard.writeText(summary);
            toast.success("Copied!");
          }}
          className="px-3 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm"
        >
          📋 Copy
        </button>
      </div>

      <div className="prose prose-lg max-w-none">
    <ReactMarkdown>{summary}</ReactMarkdown>
</div>

      <div className="flex justify-end mt-6">
        <button
          onClick={() => setSummary("")}
          className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
        >
          Close
        </button>
      </div>

    </div>

  </div>

)
}

      </div>
    </>
  );
}

export default App;
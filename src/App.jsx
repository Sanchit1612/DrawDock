import React, { useRef } from "react";
import { Tldraw, getSnapshot, loadSnapshot } from "tldraw";
import "tldraw/tldraw.css";
import "./App.css";
import "tailwindcss";
import { Toaster, toast } from "react-hot-toast";
import { supabase } from "./lib/supabase";

const params = new URLSearchParams(window.location.search);

let boardId = params.get("board");

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

  const handleSave = async () => {
    if (!editorRef.current || isSyncingRef.current) return;

    const snapshot = getSnapshot(editorRef.current.store);

    const { error } = await supabase
      .from("boards")
      .upsert(
        {
          id: boardId,
          snapshot,
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

  return (
    <>
      <Toaster position="bottom-center" />

      <div className="app">
        <Tldraw
          onMount={(editor) => {
            editorRef.current = editor;

            handleLoad();

            editor.store.listen(
              () => {
                if (isSyncingRef.current) return;

                clearTimeout(timeoutRef.current);

                timeoutRef.current = setTimeout(() => {
                  
                  handleSave();
                  console.log("Calling handleSave");
                }, 1000);
              },
              {
                source: "user",
                scope: "document",
              }
            );
          }}
        />
      </div>
    </>
  );
}

export default App;
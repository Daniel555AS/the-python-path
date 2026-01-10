// Load Monaco Editor using RequireJS
require.config({
  paths: {
    vs: "https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs",
  },
});

// Monaco + Pyodide centralized module
const MonacoPyodide = (function () {
  let pyodide = null; // Pyodide instace
  let pyodideReady = false; // Indicates when Pyodide is fully loaded
  let editor = null; // Monaco editor instance

  // Initialize Monaco Editor and Pyodide
  async function initializeMonacoAndPyodide(options = {}) {
    const {
      editorId = "editor",
      outputId = "output",
      runButtonId = "run-btn",
      initialCode = '# The Python Path\nprint("Hello World!")',
      editorOptions = {},
    } = options;

    const output = document.getElementById(outputId);
    const runBtn = document.getElementById(runButtonId);

    // Load MONACO Editor
    await new Promise((resolve) => {
      require(["vs/editor/editor.main"], function () {
        editor = monaco.editor.create(document.getElementById(editorId), {
          value: initialCode,
          language: "python",
          theme: "vs-dark",
          automaticLayout: true,
          fontSize: 14,
          minimap: { enabled: false },
          ...editorOptions,
        });
        resolve();
      });
    });

    // Load PYODIDE
    output.textContent = "Loading Pyodide...\n";

    try {
      pyodide = await loadPyodide({
        indexURL: "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/",
      });

      pyodide.setStdout({ batched: (msg) => appendOutput(msg, output) });
      pyodide.setStderr({ batched: (msg) => appendOutput(msg, output, true) });

      // Expose custom input handler to the global scope
      window.pyinput = pyinput;
      // Redefine Python input() as async to work with JS
      await pyodide.runPythonAsync(`
import asyncio

async def input(prompt=''):
    return await __BRIDGE_input(prompt)
`);
      pyodide.globals.set("__BRIDGE_input", pyinput);
      pyodideReady = true;
      output.textContent += "[✔] Pyodide loaded successfully.\n";
    } catch (err) {
      output.textContent += "\n[X] Error loading Pyodide: " + err + "\n";
    }

    // Run button logic
    if (runBtn) {
      runBtn.addEventListener("click", async () => {
        if (!pyodideReady) {
          output.textContent = "Pyodide is still loading...";
          return;
        }

        // Get code from the editor
        let code = editor.getValue();
        output.textContent = "";
        // Replace input() calls with await input()
        code = code.replace(/\binput\(/g, "await input(");
        // Split code into lines
        let userLines = code.split("\n");
        // Check if the code is empty or only contains comments
        const onlyCommentsOrEmpty = userLines.every(
          (line) => line.trim() === "" || line.trim().startsWith("#")
        );

        // If empty, insert a 'pass' statement
        if (onlyCommentsOrEmpty) {
          userLines = ["pass"];
        }

        const indented = userLines.map((line) => "    " + line).join("\n");
        const wrappedCode = `
import asyncio

async def __user_code():
${indented}

await __user_code()
`;
        try {
          await pyodide.runPythonAsync(wrappedCode);
        } catch (err) {
          appendOutput("[X] Error:\n" + err + "\n", output, true);
        }
      });
    }
  }

  // Helper function to append output text
  function appendOutput(msg, output, isError = false) {
    const span = document.createElement("span");
    span.textContent = msg;
    if (isError) span.style.color = "#ff6b6b";
    output.appendChild(span);
    output.appendChild(document.createElement("br"));
    output.scrollTop = output.scrollHeight;
  }

  // Emulate Python's input()
  async function pyinput(prompt) {
    return new Promise((resolve) => {
      const output = document.getElementById("output");
      const line = document.createElement("div");
      line.style.display = "flex";
      line.style.gap = "5px";
      // Show prompt text
      const promptSpan = document.createElement("span");
      promptSpan.textContent = prompt;
      line.appendChild(promptSpan);
      // Input field for user response
      const inputBox = document.createElement("input");
      inputBox.type = "text";
      inputBox.placeholder = "Type...";
      line.appendChild(inputBox);
      output.appendChild(line);
      output.scrollTop = output.scrollHeight;
      // Resolve promise when Enter is pressed
      inputBox.addEventListener("keypress", (event) => {
        if (event.key === "Enter") {
          const valueSpan = document.createElement("span");
          valueSpan.textContent = inputBox.value;
          line.replaceChild(valueSpan, inputBox);
          resolve(inputBox.value);
        }
      });
      inputBox.focus();
    });
  }

  return {
    initializeMonacoAndPyodide,
    getEditor: () => editor,
    getPyodide: () => pyodide,
    isPyodideReady: () => pyodideReady,
    pyinput,
  };
})();

window.MonacoPyodide = MonacoPyodide;

// Load Monaco Editor using RequireJS
require.config({
  paths: {
    vs: "https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs",
  },
});

// Monaco + Pyodide centralized module
const MonacoPyodide = (function () {
  let pyodide = null;
  let pyodideReady = false;
  let editor = null;

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

    // Load MONACO
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

      // Expose JS input
      window.pyinput = pyinput;
      pyodide.globals.set("__BRIDGE_input", pyinput);

      // input async
      await pyodide.runPythonAsync(`
import asyncio

async def input(prompt=''):
    return await __BRIDGE_input(prompt)
`);

      pyodideReady = true;
      output.textContent += "[✔] Pyodide loaded successfully.\n";
    } catch (err) {
      output.textContent += "\n[X] Error loading Pyodide: " + err + "\n";
    }

    // Run Button
    if (runBtn) {
      runBtn.addEventListener("click", async () => {
        if (!pyodideReady) {
          output.textContent = "Pyodide is still loading...";
          return;
        }

        let code = editor.getValue();
        output.textContent = "";

        // For empty code
        const onlyCommentsOrEmpty = code
          .split("\n")
          .every((line) => line.trim() === "" || line.trim().startsWith("#"));

        if (onlyCommentsOrEmpty) {
          code = "pass";
        }

        // Detect if the code uses input()
        const usesInput = /\binput\s*\(/.test(code);

        try {
          if (usesInput) {
            const transformedCode = code.replace(/\binput\s*\(/g, "await input(");
            const wrappedCode = `
import asyncio

async def __runner__():
${transformedCode.split("\n").map(line => "    " + line).join("\n")}

await __runner__()
`;
            await pyodide.runPythonAsync(wrappedCode);
          } else {
            // Run directly globally without async
            await pyodide.runPythonAsync(`
exec("""
${code.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}
""", globals())
`);
          }
        } catch (err) {
          appendOutput("[X] Error:\n" + err + "\n", output, true);
        }
      });
    }
  }

  function appendOutput(msg, output, isError = false) {
    const span = document.createElement("span");
    span.textContent = msg;
    if (isError) span.style.color = "#ff6b6b";
    output.appendChild(span);
    output.appendChild(document.createElement("br"));
    output.scrollTop = output.scrollHeight;
  }

  async function pyinput(prompt) {
    return new Promise((resolve) => {
      const output = document.getElementById("output");

      const line = document.createElement("div");
      line.style.display = "flex";
      line.style.gap = "5px";

      const promptSpan = document.createElement("span");
      promptSpan.textContent = prompt;
      line.appendChild(promptSpan);

      const inputBox = document.createElement("input");
      inputBox.type = "text";
      inputBox.placeholder = "Type...";
      line.appendChild(inputBox);

      output.appendChild(line);
      output.scrollTop = output.scrollHeight;

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
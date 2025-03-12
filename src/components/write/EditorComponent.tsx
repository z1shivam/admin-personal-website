import "easymde/dist/easymde.min.css";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";
import SimpleMdeReact from "react-simplemde-editor";

const EditorComponent = forwardRef(
  ({ initialValue = "", disabled }: { initialValue?: string; disabled: boolean }, ref) => {
    const valueRef = useRef(initialValue); // Initialize with initialValue
    const editorInstanceRef = useRef<any>(null);

    const onChange = useCallback((value: string) => {
      valueRef.current = value;
    }, []);

    const autofocusNoSpellcheckerOptions = useMemo(() => ({
      autofocus: false,
      spellChecker: true,
    }), []);

    useEffect(() => {
      if (editorInstanceRef.current) {
        editorInstanceRef.current.codemirror.setOption("readOnly", disabled ? "nocursor" : false);
      }
    }, [disabled]);

    useImperativeHandle(ref, () => ({
      getValue: () => valueRef.current,
      setValue: (newValue: string) => {
        valueRef.current = newValue;
        if (editorInstanceRef.current) {
          editorInstanceRef.current.value(newValue);
        }
      },
    }));

    const handleEditorInstance = (instance: any) => {
      editorInstanceRef.current = instance;
      instance.value(valueRef.current); // Set initial value only once
    };

    return (
      <div className={disabled ? "pointer-events-none opacity-50" : ""}>
        <SimpleMdeReact
          options={autofocusNoSpellcheckerOptions}
          value={valueRef.current}
          onChange={onChange}
          className="prose w-full max-w-7xl"
          getMdeInstance={handleEditorInstance}
          placeholder="Write something here..."
          aria-disabled={disabled} // Apply aria-disabled for accessibility
        />
      </div>
    );
  }
);

export default EditorComponent;

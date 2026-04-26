import { useEffect } from "react";
import useAppStore from "../store";
import { runAIAnalysis } from "../services/socket";

function useAIAnalysis() {
  const readings = useAppStore((state) => state.readings);
  const setAiInsight = useAppStore((state) => state.setAiInsight);

  useEffect(() => {
    if (!readings.length || readings.length % 30 !== 0) {
      return;
    }

    runAIAnalysis(readings).then(setAiInsight).catch(console.error);
  }, [readings, setAiInsight]);
}

export default useAIAnalysis;

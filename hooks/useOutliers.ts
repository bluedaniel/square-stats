"use client";

import { useState, useEffect } from "react";

export function useOutliers() {
  const [hideOutliers, setHideOutliers] = useState(
    () => typeof window !== "undefined" && localStorage.getItem("hideOutliers") === "true"
  );

  useEffect(() => {
    localStorage.setItem("hideOutliers", String(hideOutliers));
  }, [hideOutliers]);

  return { hideOutliers, setHideOutliers };
}

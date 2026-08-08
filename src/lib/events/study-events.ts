"use client";

const STUDY_ACTIVITY_EVENT = "vocab:study_activity_updated";

export function notifyStudyActivityUpdated() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(STUDY_ACTIVITY_EVENT));
  }
}

export function subscribeStudyActivityUpdated(callback: () => void): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handler = () => {
    callback();
  };

  window.addEventListener(STUDY_ACTIVITY_EVENT, handler);
  return () => {
    window.removeEventListener(STUDY_ACTIVITY_EVENT, handler);
  };
}

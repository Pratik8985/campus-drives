"use client";

import { useEffect, useState } from "react";
import { MdCheckCircle, MdError, MdClose } from "react-icons/md";

type ToastProps = {
  message: string;
  type?: "success" | "error";
  duration?: number;
};

export default function Toast({
  message,
  type = "success",
  duration = 3000,
}: ToastProps) {
  const [visible, setVisible] = useState(true);
  const [animateOut, setAnimateOut] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      handleClose();
    }, duration);

    return () => clearTimeout(timeout);
  }, [duration]);

  const handleClose = () => {
    setAnimateOut(true);
    setTimeout(() => setVisible(false), 300); // sync with animation duration
  };

  if (!visible) return null;

  return (
    <div
      className={`fixed top-6 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md px-4 sm:px-0 transition-all duration-300 ease-in-out ${
        animateOut ? "-translate-y-10 opacity-0" : "translate-y-0 opacity-100"
      }`}
    >
      <div
        className={`flex items-start gap-3 rounded-xl shadow-lg px-5 py-4 sm:py-5 sm:px-6 text-sm sm:text-base border relative ${
          type === "success"
            ? "bg-green-100 text-green-800 border-green-300"
            : "bg-red-100 text-red-800 border-red-300"
        }`}
      >
        <div className="mt-0.5 text-xl sm:text-2xl">
          {type === "success" ? (
            <MdCheckCircle className="text-green-700" />
          ) : (
            <MdError className="text-red-700" />
          )}
        </div>
        <div className="flex-1">{message}</div>
        <button
          onClick={handleClose}
          className="absolute top-2.5 right-2.5 text-gray-500 hover:text-gray-800"
        >
          <MdClose className="text-lg sm:text-xl" />
        </button>
      </div>
    </div>
  );
}

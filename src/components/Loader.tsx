"use client";

export default function Loader({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-white/30">
      <div className="bg-white p-6 rounded-2xl shadow-xl flex flex-col items-center gap-4 max-w-xs w-full mx-4">
        <div className="relative w-10 h-10">
          <div className="absolute inset-0 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
        </div>
        <span className="text-sm text-gray-700 font-medium text-center">{message}</span>
      </div>
    </div>
  );
}

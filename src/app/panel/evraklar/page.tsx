"use client";

import { useState, useEffect } from "react";

interface DocumentItem {
  id: number;
  vehicleId: number | null;
  docType: string;
  docDate: string;
  title: string;
  fileUrl: string;
  note: string | null;
  createdAt: string;
}

export default function EvraklarPage() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [docType, setDocType] = useState<string>("gorev_formu");
  const [title, setTitle] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [file, setFile] = useState<File null |>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/documents?date=${selectedDate}`);
      if (res.ok) {
        const data = await res.json();
        setDocuments(data);
      }
    } catch (err) {
      console.error("Belgeler yüklenirken hata:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [selectedDate]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title) {
      alert("Lütfen bir başlık yazın ve dosya seçin.");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", title);
      formData.append("docType", docType);
      formData.append("docDate", selectedDate);
      formData.append("note", note);

      const res = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        alert("Evrak başarıyla yüklendi ve arşivlendi!");
        setTitle("");
        setNote("");
        setFile(null);
        fetchDocuments();
      } else {
        const errData = await res.json();
        alert("Yükleme hatası: " + (errData.error || "Bilinmeyen hata"));
      }
    } catch (err) {
      console.error("Yükleme sırasında hata:", err);
      alert("Yükleme başarısız oldu.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">
            📁 Evrak ve Belge Arşivi
          </h1>
          <p className="text-sm text-slate-400">
            Günlük görev formları, yakıt POS slipleri ve faturaları tarihe göre yönetin.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl p-2">
          <span className="text-xs text-slate-400 font-medium px-2">Arşiv Tarihi:</span>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-slate-950 text-slate-200 text-sm rounded-lg px-3 py-1.5 border border-slate-700 focus:outline-none focus:border-sky-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <h2 className="text-base font-semibold text-slate-200 mb-4 flex items-center gap-2">
            <span>📤</span> Yeni Evrak Yükle ({selectedDate})
          </h2>
          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Belge Türü
              </label>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                className="w-full bg-slate-950 text-slate-200 text-sm rounded-xl px-3 py-2.5 border border-slate-800 focus:outline-none focus:border-sky-500"
              >
                <option value="gorev_formu">📋 Günlük Görev Formu</option>
                <option value="pos_slip">⛽ Yakıt POS Slipi</option>
                <option value="fatura">🧾 Servis / Yedek Parça Faturası</option>
                <option value="diger">📄 Diğer Evrak</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Evrak Başlığı / Açıklaması *
              </label>
              <input
                type="text"
                placeholder="Örn: 06 FH 6114 Günlük Görev Formu"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full bg-slate-950 text-slate-200 text-sm rounded-xl px-3 py-2.5 border border-slate-800 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Dosya Seç (PDF veya Fotoğraf) *
              </label>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                required
                className="w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-sky-600 file:text-white hover:file:bg-sky-500 cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Ek Not (İsteğe bağlı)
              </label>
              <textarea
                placeholder="Şoför veya rota bilgisi..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                className="w-full bg-slate-950 text-slate-200 text-sm rounded-xl px-3 py-2.5 border border-slate-800 focus:outline-none focus:border-sky-500"
              />
            </div>

            <button
              type="submit"
              disabled={uploading}
              className="w-full bg-sky-600 hover:bg-sky-500 text-white font-medium py-2.5 rounded-xl transition shadow-lg shadow-sky-900/30 disabled:opacity-50"
            >
              {uploading ? "Yükleniyor ve Arşivleniyor..." : "Evrakı Arşive Kaydet"}
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-200 flex items-center gap-2">
              <span>📋</span> {selectedDate} Tarihli Arşiv Kayıtları
            </h2>
            <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-1 rounded-lg">
              {documents.length} Evrak Bulundu
            </span>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-500">Arşiv yükleniyor...</div>
          ) : documents.length === 0 ? (
            <div className="py-12 text-center text-slate-500 border border-dashed border-slate-800 rounded-xl">
              Bu tarihe ait henüz yüklenmiş evrak bulunmuyor.
            </div>
          ) : (
            <div className="space-y-3 overflow-y-auto max-h-[500px]">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3.5 bg-slate-950 border border-slate-800/80 rounded-xl hover:border-slate-700 transition"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-sky-500/10 text-sky-400">
                        {doc.docType === "gorev_formu"
                          ? "Görev Formu"
                          : doc.docType === "pos_slip"
                          ? "Yakıt POS"
                          : doc.docType === "fatura"
                          ? "Fatura"
                          : "Diğer"}
                      </span>
                      <h3 className="text-sm font-medium text-slate-200">{doc.title}</h3>
                    </div>
                    {doc.note && <p className="text-xs text-slate-400">{doc.note}</p>}
                    <p className="text-[11px] text-slate-500">
                      Ekleyen: {doc.createdBy || "Sistem"}
                    </p>
                  </div>
                  <a
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition flex items-center gap-1.5"
                  >
                    <span>👁️</span> Görüntüle
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

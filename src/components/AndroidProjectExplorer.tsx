import { useEffect, useState } from 'react';
import { Check, Copy, Download, FileCode2, FolderTree, Smartphone, Terminal, ShieldCheck } from 'lucide-react';

interface AndroidFileEntry {
  path: string;
  size: number;
  content?: string;
}

export default function AndroidProjectExplorer() {
  const [files, setFiles] = useState<AndroidFileEntry[]>([]);
  const [selectedPath, setSelectedPath] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    let active = true;
    fetch('/api/android-files')
      .then(async (res) => {
        if (!res.ok) throw new Error('Failed to load Android project files');
        return res.json();
      })
      .then((data: { files: AndroidFileEntry[] }) => {
        if (!active) return;
        const sorted = [...data.files].sort((a, b) => a.path.localeCompare(b.path));
        setFiles(sorted);
        const preferred =
          sorted.find((f) => f.path.endsWith('MainActivity.kt')) ||
          sorted.find((f) => f.content) ||
          sorted[0];
        if (preferred) setSelectedPath(preferred.path);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Unable to load Android files');
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const selectedFile = files.find((f) => f.path === selectedPath);

  const handleCopy = async () => {
    if (!selectedFile?.content) return;
    await navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="space-y-6">
      {/* Architecture & Build Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-[#D5E1E4] p-5 shadow-xs">
          <div className="flex items-center gap-2.5 text-[#007E8A] font-semibold mb-2">
            <Smartphone className="w-5 h-5" />
            <span>Build APK (Android Studio)</span>
          </div>
          <p className="text-sm text-[#5C6B73] mb-3">
            Download the ZIP below, extract it, and open it in <strong>Android Studio</strong> → <em>Build → Build App Bundle(s) / APK(s) → Build APK(s)</em>, or run:
          </p>
          <pre className="bg-[#0F2430] text-[#E2F5F7] text-xs p-3 rounded-xl overflow-x-auto">
{`gradle assembleDebug
# Output: app/build/outputs/apk/debug/app-debug.apk`}
          </pre>
        </div>

        <div className="bg-white rounded-2xl border border-[#D5E1E4] p-5 shadow-xs">
          <div className="flex items-center gap-2.5 text-[#007E8A] font-semibold mb-2">
            <Terminal className="w-5 h-5" />
            <span>Build APK Without Android Studio</span>
          </div>
          <p className="text-sm text-[#5C6B73] mb-3">
            Included <code className="bg-[#F0F7F8] px-1.5 py-0.5 rounded text-[#005F69]">.github/workflows/build-apk.yml</code> builds an installable <code className="bg-[#F0F7F8] px-1.5 py-0.5 rounded text-[#005F69]">app-debug.apk</code> artifact automatically when pushed to GitHub Actions.
          </p>
          <pre className="bg-[#0F2430] text-[#E2F5F7] text-xs p-3 rounded-xl overflow-x-auto">
{`./gradlew assembleRelease
./gradlew bundleRelease`}
          </pre>
        </div>

        <div className="bg-white rounded-2xl border border-[#D5E1E4] p-5 shadow-xs">
          <div className="flex items-center gap-2.5 text-[#007E8A] font-semibold mb-2">
            <ShieldCheck className="w-5 h-5" />
            <span>Secure Backend Bridge</span>
          </div>
          <p className="text-sm text-[#5C6B73]">
            All student verification, PIN lookup, 41 FAQs, regional translation, and support queries flow through HTTPS REST endpoints (<code className="bg-[#F0F7F8] px-1.5 py-0.5 rounded text-[#005F69]">/api/*</code>) with signed Bearer tokens—keeping Google Sheets &amp; API credentials off the APK.
          </p>
        </div>
      </div>

      {/* Source File Browser */}
      <div className="bg-white rounded-2xl border border-[#D5E1E4] overflow-hidden shadow-xs">
        <div className="px-5 py-4 border-b border-[#D5E1E4] flex flex-wrap items-center justify-between gap-3 bg-[#F7FBFC]">
          <div className="flex items-center gap-2">
            <FolderTree className="w-5 h-5 text-[#007E8A]" />
            <h2 className="font-bold text-[#232B2E]">
              Native Kotlin &amp; Jetpack Compose Source ({files.length} files in <span className="text-[#007E8A]">android-app/</span>)
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/api/android-project.zip"
              download="anudip-student-care-android.zip"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#007E8A] hover:bg-[#006973] text-white transition shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              Download Android Project (.zip)
            </a>
            {selectedFile?.content && (
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-[#D5E1E4] bg-white hover:bg-[#F0F7F8] text-[#232B2E] transition"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-[#007E8A]" />}
                {copied ? 'Copied' : 'Copy File'}
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="p-10 text-center text-sm text-[#5C6B73]">Loading Android project tree...</div>
        ) : error ? (
          <div className="p-6 text-sm text-red-700 bg-red-50">{error}</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[520px]">
            <div className="lg:col-span-4 border-b lg:border-b-0 lg:border-r border-[#D5E1E4] max-h-[560px] overflow-y-auto p-3 space-y-1 bg-[#FAFDFE]">
              {files.map((file) => {
                const active = file.path === selectedPath;
                return (
                  <button
                    key={file.path}
                    onClick={() => setSelectedPath(file.path)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-mono flex items-center justify-between gap-2 transition ${
                      active
                        ? 'bg-[#E2F5F7] text-[#005F69] font-semibold'
                        : 'text-[#232B2E] hover:bg-[#EEF4F6]'
                    }`}
                  >
                    <span className="truncate flex items-center gap-2">
                      <FileCode2 className="w-3.5 h-3.5 shrink-0 text-[#007E8A]" />
                      {file.path}
                    </span>
                    <span className="text-[11px] text-[#5C6B73] shrink-0">
                      {Math.max(1, Math.round(file.size / 1024))}KB
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="lg:col-span-8 max-h-[560px] overflow-auto bg-[#0F2430] text-[#E6F1F4] p-4">
              {selectedFile?.content ? (
                <pre className="text-xs leading-relaxed font-mono whitespace-pre">
                  {selectedFile.content}
                </pre>
              ) : (
                <div className="text-sm text-[#9FB8C0] p-6">
                  Binary asset ({selectedFile?.path}, {selectedFile?.size} bytes).
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

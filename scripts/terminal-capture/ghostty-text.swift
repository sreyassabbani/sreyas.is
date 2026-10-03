// Use Ghostty's documented scripting API. Address the dedicated capture PID,
// never whichever Ghostty instance happens to be frontmost.
import AppKit
import Darwin

func code(_ value: String) -> FourCharCode {
    value.utf8.reduce(0) { ($0 << 8) | FourCharCode($1) }
}

func fail(_ message: String) -> Never {
    FileHandle.standardError.write(Data("\(message)\n".utf8))
    exit(1)
}

struct ExportError: Error { let message: String }

guard CommandLine.arguments.count >= 3,
      let pid = Int32(CommandLine.arguments[1]), pid > 0
else { fail("usage: ghostty-text.swift <dedicated-pid> export | input <text>") }

let terminal = NSAppleEventDescriptor.record()
terminal.setDescriptor(NSAppleEventDescriptor(typeCode: code("Gtrm")), forKeyword: code("want"))
terminal.setDescriptor(NSAppleEventDescriptor(enumCode: code("indx")), forKeyword: code("form"))
terminal.setDescriptor(NSAppleEventDescriptor(int32: 1), forKeyword: code("seld"))
terminal.setDescriptor(NSAppleEventDescriptor.null(), forKeyword: code("from"))
guard let spec = terminal.coerce(toDescriptorType: code("obj ")) else {
    fail("could not construct the Ghostty terminal reference")
}

func send(_ action: String, _ value: String, _ parameter: String) throws {
    let event = NSAppleEventDescriptor(
        eventClass: code("Ghst"), eventID: code(action),
        targetDescriptor: NSAppleEventDescriptor(processIdentifier: pid),
        returnID: -1, transactionID: 0
    )
    event.setParam(NSAppleEventDescriptor(string: value), forKeyword: code("----"))
    event.setParam(spec, forKeyword: code(parameter))
    let reply = try event.sendEvent(options: [.waitForReply], timeout: 5)
    if let error = reply.paramDescriptor(forKeyword: code("errn")), error.int32Value != 0 {
        throw NSError(domain: NSOSStatusErrorDomain, code: Int(error.int32Value))
    }
    if action == "PfAc", reply.paramDescriptor(forKeyword: code("----"))?.booleanValue != true {
        throw ExportError(message: "Ghostty did not perform the HTML export action")
    }
}

do {
    switch CommandLine.arguments[2] {
    case "input":
        guard CommandLine.arguments.count == 4 else { fail("input requires text") }
        try send("InTx", CommandLine.arguments[3], "GItT")
        try send("SKey", "enter", "GKeT")
    case "export":
        // Ghostty exports its path through the system clipboard. Serialize
        // independent capture processes so their paths cannot cross.
        let lockPath = NSTemporaryDirectory() + "sreyas-terminal-export.lock"
        let lockFD = Darwin.open(lockPath, O_CREAT | O_RDWR, 0o600)
        guard lockFD >= 0 else { throw ExportError(message: "cannot open the export lock") }
        defer { _ = Darwin.lockf(lockFD, F_ULOCK, 0); Darwin.close(lockFD) }
        let deadline = Date().addingTimeInterval(5)
        while Darwin.lockf(lockFD, F_TLOCK, 0) != 0 {
            if Date() >= deadline { throw ExportError(message: "another terminal export is still running") }
            Thread.sleep(forTimeInterval: 0.02)
        }
        let clipboard = NSPasteboard.general
        let saved: [NSPasteboardItem] = clipboard.pasteboardItems?.map { item in
            let copy = NSPasteboardItem()
            for type in item.types {
                if let data = item.data(forType: type) { copy.setData(data, forType: type) }
            }
            return copy
        } ?? []
        let originalChangeCount = clipboard.changeCount
        var exportChangeCount: Int?
        defer {
            // Do not overwrite something the user copied during export.
            if let expected = exportChangeCount, clipboard.changeCount == expected {
                clipboard.clearContents()
                if !saved.isEmpty { clipboard.writeObjects(saved.map { $0 as NSPasteboardWriting }) }
            }
        }
        try send("PfAc", "write_screen_file:copy,html", "GonT")
        guard clipboard.changeCount != originalChangeCount,
              let name = clipboard.string(forType: .string)
        else { throw ExportError(message: "Ghostty did not copy an export path") }
        exportChangeCount = clipboard.changeCount
        let url = URL(fileURLWithPath: name).resolvingSymlinksInPath()
        let temporaryRoot = URL(fileURLWithPath: NSTemporaryDirectory()).resolvingSymlinksInPath().path + "/"
        guard url.path.hasPrefix(temporaryRoot), url.lastPathComponent == "screen.html" else {
            throw ExportError(message: "Ghostty returned an unexpected export path")
        }
        let data = try Data(contentsOf: url)
        FileHandle.standardOutput.write(data)
        // Only remove the file created by this action, not the shared temp directory.
        try? FileManager.default.removeItem(at: url)
        url.deletingLastPathComponent().path.withCString { _ = Darwin.rmdir($0) }
    default:
        fail("unknown Ghostty text operation")
    }
} catch {
    fail("Ghostty scripting failed: \(error). Check macOS Automation permission.")
}

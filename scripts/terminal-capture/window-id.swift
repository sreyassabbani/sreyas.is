import CoreGraphics
import Foundation

if CommandLine.arguments.count == 2, CommandLine.arguments[1] == "--preflight" {
    print(CGPreflightScreenCaptureAccess() ? "true" : "false")
    exit(0)
}

let options: CGWindowListOption = [.optionOnScreenOnly, .excludeDesktopElements]
let windowInfo = CGWindowListCopyWindowInfo(options, kCGNullWindowID)
    as? [[String: Any]] ?? []

if CommandLine.arguments.count == 4,
   CommandLine.arguments[1] == "--verify",
   let ownerPID = Int32(CommandLine.arguments[2]),
   let expectedID = UInt32(CommandLine.arguments[3])
{
    let matches = windowInfo.contains { window in
        guard
            let pid = window[kCGWindowOwnerPID as String] as? Int32,
            let number = window[kCGWindowNumber as String] as? UInt32,
            let layer = window[kCGWindowLayer as String] as? Int,
            let alpha = window[kCGWindowAlpha as String] as? Double,
            let bounds = window[kCGWindowBounds as String] as? [String: Any],
            let width = bounds["Width"] as? Double,
            let height = bounds["Height"] as? Double
        else {
            return false
        }

        return pid == ownerPID && number == expectedID && layer == 0
            && alpha > 0 && width >= 200 && height >= 120
    }

    exit(matches ? 0 : 1)
}

guard CommandLine.arguments.count == 3,
      let ownerPID = Int32(CommandLine.arguments[1])
else {
    FileHandle.standardError.write(
        Data("usage: window-id.swift <pid> <exact-title> | --verify <pid> <window-id> | --preflight\n".utf8)
    )
    exit(2)
}
let expectedTitle = CommandLine.arguments[2]

let candidates = windowInfo.compactMap { window -> (id: UInt32, area: Double)? in
    guard
        let pid = window[kCGWindowOwnerPID as String] as? Int32,
        pid == ownerPID,
        let title = window[kCGWindowName as String] as? String,
        title == expectedTitle,
        let layer = window[kCGWindowLayer as String] as? Int,
        layer == 0,
        let alpha = window[kCGWindowAlpha as String] as? Double,
        alpha > 0,
        let number = window[kCGWindowNumber as String] as? UInt32,
        let bounds = window[kCGWindowBounds as String] as? [String: Any],
        let width = bounds["Width"] as? Double,
        let height = bounds["Height"] as? Double,
        width >= 200,
        height >= 120
    else {
        return nil
    }

    return (number, width * height)
}

guard let window = candidates.max(by: { $0.area < $1.area }) else {
    exit(1)
}

print(window.id)

import CoreGraphics
import Foundation

let listAll = CommandLine.arguments.contains("--all")
let options: CGWindowListOption = [.optionOnScreenOnly, .excludeDesktopElements]

guard let windows = CGWindowListCopyWindowInfo(options, kCGNullWindowID) as? [[String: Any]] else {
    exit(1)
}

var found = false
for window in windows {
    guard let owner = window[kCGWindowOwnerName as String] as? String,
          owner == "Safari",
          let layer = window[kCGWindowLayer as String] as? Int,
          layer == 0,
          let id = window[kCGWindowNumber as String] as? Int else { continue }

    if !listAll {
        print(id)
        exit(0)
    }

    let title = window[kCGWindowName as String] as? String ?? ""
    var boundsText = "unknown"
    if let bounds = window[kCGWindowBounds as String] as? [String: Any],
       let rect = CGRect(dictionaryRepresentation: bounds as CFDictionary) {
        boundsText = "\(Int(rect.origin.x)),\(Int(rect.origin.y)),\(Int(rect.width)),\(Int(rect.height))"
    }
    print("\(id)\t\(boundsText)\t\(title)")
    found = true
}

exit(found ? 0 : 1)

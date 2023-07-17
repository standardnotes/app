import UIKit
import Social
import MobileCoreServices
import Photos
import UniformTypeIdentifiers

let hostAppBundleIdentifier = "com.standardnotes.standardnotes"
let shareProtocol = hostAppBundleIdentifier

class ShareViewController: SLComposeServiceViewController {
  let sharedKey = "ShareKey"
  var sharedMedia: [SharedMediaFile] = []
  var sharedText: [String] = []
  var sharedURL: [String] = []
  let imageContentType = UTType.image.identifier
  let videoContentType = UTType.movie.identifier
  let textContentType = UTType.text.identifier
  let urlContentType = UTType.url.identifier
  let fileURLType = UTType.fileURL.identifier;
  
  override func isContentValid() -> Bool {
    return true
  }
  
  override func viewDidLoad() {
    super.viewDidLoad();
  }
  
  override func viewDidAppear(_ animated: Bool) {
    super.viewDidAppear(animated)
    
    if let content = extensionContext!.inputItems[0] as? NSExtensionItem {
      if let contents = content.attachments {
        for (index, attachment) in (contents).enumerated() {
          if attachment.hasItemConformingToTypeIdentifier(fileURLType) {
            handleFiles(content: content, attachment: attachment, index: index)
          } else if attachment.hasItemConformingToTypeIdentifier(imageContentType) {
            handleImages(content: content, attachment: attachment, index: index)
          } else if attachment.hasItemConformingToTypeIdentifier(textContentType) {
            handleText(content: content, attachment: attachment, index: index)
          } else if attachment.hasItemConformingToTypeIdentifier(urlContentType) {
            handleUrl(content: content, attachment: attachment, index: index)
          } else if attachment.hasItemConformingToTypeIdentifier(videoContentType) {
            handleVideos(content: content, attachment: attachment, index: index)
          }
        }
      }
    }
  }
  
  override func didSelectPost() {
    print("didSelectPost");
  }
  
  override func configurationItems() -> [Any]! {
    // To add configuration options via table cells at the bottom of the sheet, return an array of SLComposeSheetConfigurationItem here.
    return []
  }
  
  private func handleText (content: NSExtensionItem, attachment: NSItemProvider, index: Int) {
    attachment.loadItem(forTypeIdentifier: textContentType, options: nil) { [weak self] data, error in
      
      if error == nil, let item = data as? String, let this = self {
        
        this.sharedText.append(item)
        
        if index == (content.attachments?.count)! - 1 {
          this.redirectToHostApp()
        }
        
      } else {
        self?.dismissWithError()
      }
    }
  }
  
  private func handleUrl (content: NSExtensionItem, attachment: NSItemProvider, index: Int) {
    attachment.loadItem(forTypeIdentifier: urlContentType, options: nil) { [weak self] data, error in
      
      if error == nil, let item = data as? URL, let this = self {
        
        this.sharedURL.append(item.absoluteString)
        
        if index == (content.attachments?.count)! - 1 {
          this.redirectToHostApp()
        }
        
      } else {
        self?.dismissWithError()
      }
    }
  }
  
  private func handleImages (content: NSExtensionItem, attachment: NSItemProvider, index: Int) {
    attachment.loadItem(forTypeIdentifier: imageContentType, options: nil) { [weak self] data, error in
      
      if error == nil, let url = data as? URL, let this = self {
        //  this.redirectToHostApp(type: .media)
        // Always copy
        let fileExtension = this.getExtension(from: url, type: .video)
        let newName = UUID().uuidString
        let newPath = FileManager.default
          .containerURL(forSecurityApplicationGroupIdentifier: "group.\(hostAppBundleIdentifier)")!
          .appendingPathComponent("\(newName).\(fileExtension)")
        let copied = this.copyFile(at: url, to: newPath)
        if(copied) {
          this.sharedMedia.append(SharedMediaFile(path: newPath.absoluteString, thumbnail: nil, duration: nil, type: .image))
        }
        
        if index == (content.attachments?.count)! - 1 {
          this.redirectToHostApp()
        }
        
      } else {
        self?.dismissWithError()
      }
    }
  }
  
  private func handleVideos (content: NSExtensionItem, attachment: NSItemProvider, index: Int) {
    attachment.loadItem(forTypeIdentifier: videoContentType, options:nil) { [weak self] data, error in
      
      if error == nil, let url = data as? URL, let this = self {
        
        // Always copy
        let fileExtension = this.getExtension(from: url, type: .video)
        let newName = UUID().uuidString
        let newPath = FileManager.default
          .containerURL(forSecurityApplicationGroupIdentifier: "group.\(hostAppBundleIdentifier)")!
          .appendingPathComponent("\(newName).\(fileExtension)")
        let copied = this.copyFile(at: url, to: newPath)
        if(copied) {
          guard let sharedFile = this.getSharedMediaFile(forVideo: newPath) else {
            return
          }
          this.sharedMedia.append(sharedFile)
        }
        
        if index == (content.attachments?.count)! - 1 {
          this.redirectToHostApp()
        }
        
      } else {
        self?.dismissWithError()
      }
    }
  }
  
  private func handleFiles (content: NSExtensionItem, attachment: NSItemProvider, index: Int) {
    attachment.loadItem(forTypeIdentifier: fileURLType, options: nil) { [weak self] data, error in
      
      if error == nil, let url = data as? URL, let this = self {
        
        // Always copy
        let newName = this.getFileName(from :url)
        let newPath = FileManager.default
          .containerURL(forSecurityApplicationGroupIdentifier: "group.\(hostAppBundleIdentifier)")!
          .appendingPathComponent("\(newName)")
        let copied = this.copyFile(at: url, to: newPath)
        if (copied) {
          this.sharedMedia.append(SharedMediaFile(path: newPath.absoluteString, thumbnail: nil, duration: nil, type: .file))
        }
        
        if index == (content.attachments?.count)! - 1 {
          this.redirectToHostApp()
        }
        
      } else {
        self?.dismissWithError()
      }
    }
  }
  
  private func redirectToHostApp() {
    let userDefaults = UserDefaults(suiteName: "group.\(hostAppBundleIdentifier)")
    userDefaults?.set(self.toData(data: self.sharedMedia), forKey: "\(self.sharedKey).media")
    userDefaults?.set(self.sharedText, forKey: "\(self.sharedKey).text")
    userDefaults?.set(self.sharedURL, forKey: "\(self.sharedKey).url")
    userDefaults?.synchronize()
    
    let url = URL(string: "\(shareProtocol)://dataUrl=\(sharedKey)")
    var responder = self as UIResponder?
    let selectorOpenURL = sel_registerName("openURL:")
    
    while (responder != nil) {
      if (responder?.responds(to: selectorOpenURL))! {
        let _ = responder?.perform(selectorOpenURL, with: url)
      }
      responder = responder!.next
    }
    
    extensionContext!.completeRequest(returningItems: [], completionHandler: nil)
  }
  
  private func dismissWithError() {
    print("[ERROR] Error loading data!")
    let alert = UIAlertController(title: "Error", message: "Error loading data", preferredStyle: .alert)
    
    let action = UIAlertAction(title: "Error", style: .cancel) { _ in
      self.dismiss(animated: true, completion: nil)
    }
    
    alert.addAction(action)
    present(alert, animated: true, completion: nil)
    extensionContext!.completeRequest(returningItems: [], completionHandler: nil)
  }
  
  private func alertLog(message: String) {
    let alert = UIAlertController(title: "Log", message: message, preferredStyle: .alert)
    
    let action = UIAlertAction(title: "OK", style: .default)
    
    alert.addAction(action)
    present(alert, animated: true, completion: nil)
  }
  
  enum RedirectType {
    case media
    case text
    case file
  }
  
  func getExtension(from url: URL, type: SharedMediaType) -> String {
    let parts = url.lastPathComponent.components(separatedBy: ".")
    var ex: String? = nil
    if (parts.count > 1) {
      ex = parts.last
    }
    
    if (ex == nil) {
      switch type {
      case .image:
        ex = "PNG"
      case .video:
        ex = "MP4"
      case .file:
        ex = "TXT"
      }
    }
    return ex ?? "Unknown"
  }
  
  func getFileName(from url: URL) -> String {
    var name = url.lastPathComponent
    
    if (name == "") {
      name = UUID().uuidString + "." + getExtension(from: url, type: .file)
    }
    
    return name
  }
  
  func copyFile(at srcURL: URL, to dstURL: URL) -> Bool {
    do {
      if FileManager.default.fileExists(atPath: dstURL.path) {
        try FileManager.default.removeItem(at: dstURL)
      }
      try FileManager.default.copyItem(at: srcURL, to: dstURL)
    } catch (let error) {
      print("Cannot copy item at \(srcURL) to \(dstURL): \(error)")
      return false
    }
    return true
  }
  
  private func getSharedMediaFile(forVideo: URL) -> SharedMediaFile? {
    let asset = AVAsset(url: forVideo)
    let duration = (CMTimeGetSeconds(asset.duration) * 1000).rounded()
    let thumbnailPath = getThumbnailPath(for: forVideo)
    
    if FileManager.default.fileExists(atPath: thumbnailPath.path) {
      return SharedMediaFile(path: forVideo.absoluteString, thumbnail: thumbnailPath.absoluteString, duration: duration, type: .video)
    }
    
    var saved = false
    let assetImgGenerate = AVAssetImageGenerator(asset: asset)
    assetImgGenerate.appliesPreferredTrackTransform = true
    //        let scale = UIScreen.main.scale
    assetImgGenerate.maximumSize =  CGSize(width: 360, height: 360)
    do {
      let img = try assetImgGenerate.copyCGImage(at: CMTimeMakeWithSeconds(600, preferredTimescale: Int32(1.0)), actualTime: nil)
      try UIImage.pngData(UIImage(cgImage: img))()?.write(to: thumbnailPath)
      saved = true
    } catch {
      saved = false
    }
    
    return saved ? SharedMediaFile(path: forVideo.absoluteString, thumbnail: thumbnailPath.absoluteString, duration: duration, type: .video) : nil
    
  }
  
  private func getThumbnailPath(for url: URL) -> URL {
    let fileName = Data(url.lastPathComponent.utf8).base64EncodedString().replacingOccurrences(of: "==", with: "")
    let path = FileManager.default
      .containerURL(forSecurityApplicationGroupIdentifier: "group.\(hostAppBundleIdentifier)")!
      .appendingPathComponent("\(fileName).jpg")
    return path
  }
  
  class SharedMediaFile: Codable {
    var path: String; // can be image, video or url path. It can also be text content
    var thumbnail: String?; // video thumbnail
    var duration: Double?; // video duration in milliseconds
    var type: SharedMediaType;
    
    
    init(path: String, thumbnail: String?, duration: Double?, type: SharedMediaType) {
      self.path = path
      self.thumbnail = thumbnail
      self.duration = duration
      self.type = type
    }
    
    // Debug method to print out SharedMediaFile details in the console
    func toString() {
      print("[SharedMediaFile] \n\tpath: \(self.path)\n\tthumbnail: \(self.thumbnail)\n\tduration: \(self.duration)\n\ttype: \(self.type)")
    }
  }
  
  enum SharedMediaType: Int, Codable {
    case image
    case video
    case file
  }
  
  func toData(data: [SharedMediaFile]) -> Data {
    let encodedData = try? JSONEncoder().encode(data)
    return encodedData!
  }
}

extension Array {
  subscript (safe index: UInt) -> Element? {
    return Int(index) < count ? self[Int(index)] : nil
  }
}

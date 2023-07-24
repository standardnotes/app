import Foundation
import Photos
import MobileCoreServices

@objc(ReceiveSharingIntent)
class ReceiveSharingIntent: NSObject {
  
  struct Share: Codable {
    var media: [SharedMediaFile] = []
    var text: [String] = []
    var urls: [String] = []
  }
  
  private var share = Share()
  
  @objc
  func getFileNames(_ url: String,
                    resolver resolve: RCTPromiseResolveBlock,
                    rejecter reject: RCTPromiseRejectBlock
  ) -> Void {
    let fileUrl = URL(string: url)
    let json =  handleUrl(url: fileUrl);
    if(json == "error"){
      let error = NSError(domain: "", code: 400, userInfo: nil)
      reject("message", "file type is Invalid", error);
    }else if(json == "invalid group name"){
      let error = NSError(domain: "", code: 400, userInfo: nil)
      reject("message", "invalid group name. Please check your share extention bundle name is same as `group.mainbundle name`  ", error);
    }else{
      resolve(json);
    }
  }
  
  private func handleUrl(url: URL?) -> String? {
    if let url = url {
      let appDomain = Bundle.main.bundleIdentifier!
      let userDefaults = UserDefaults(suiteName: "group.\(appDomain)")
      if let key = url.host?.components(separatedBy: "=").last {
        if let mediaJson = userDefaults?.object(forKey: "\(key).media") as? Data {
          let mediaSharedArray = decode(data: mediaJson)
          let sharedMediaFiles: [SharedMediaFile] = mediaSharedArray.compactMap {
            guard let path = getAbsolutePath(for: $0.path) else {
              return nil
            }
            
            return SharedMediaFile.init(path: path, fileName: fileNameForPath(path: path), mimeType: mimeTypeForPath(path: path))
          }
          self.share.media = sharedMediaFiles
        }
        if let textSharedArray = userDefaults?.object(forKey: "\(key).text") as? [String] {
          self.share.text =  textSharedArray
        }
        if let textSharedArray = userDefaults?.object(forKey: "\(key).url") as? [String] {
          self.share.urls =  textSharedArray
        }
        let encodedData = try? JSONEncoder().encode(self.share)
        let json = String(data: encodedData!, encoding: .utf8)!
        return json
      }
      return "error"
    }
    return "invalid group name"
  }
  
  
  private func getAbsolutePath(for identifier: String) -> String? {
    if (identifier.starts(with: "file://") || identifier.starts(with: "/var/mobile/Media") || identifier.starts(with: "/private/var/mobile")) {
      return identifier;
    }
    let phAsset = PHAsset.fetchAssets(withLocalIdentifiers: [identifier], options: .none).firstObject
    if(phAsset == nil) {
      return nil
    }
    let (url, _) = getFullSizeImageURLAndOrientation(for: phAsset!)
    return url
  }
  
  private func getFullSizeImageURLAndOrientation(for asset: PHAsset)-> (String?, Int) {
    var url: String? = nil
    var orientation: Int = 0
    let semaphore = DispatchSemaphore(value: 0)
    let options2 = PHContentEditingInputRequestOptions()
    options2.isNetworkAccessAllowed = true
    asset.requestContentEditingInput(with: options2){(input, info) in
      orientation = Int(input?.fullSizeImageOrientation ?? 0)
      url = input?.fullSizeImageURL?.path
      semaphore.signal()
    }
    semaphore.wait()
    return (url, orientation)
  }
  
  private func decode(data: Data) -> [SharedMediaFile] {
    let encodedData = try? JSONDecoder().decode([SharedMediaFile].self, from: data)
    return encodedData!
  }
  
  private func toJson(data: [SharedMediaFile]?) -> String? {
    if data == nil {
      return nil
    }
    let encodedData = try? JSONEncoder().encode(data)
    let json = String(data: encodedData!, encoding: .utf8)!
    return json
  }
  
  class SharedMediaFile: Codable {
    var path: String;
    var fileName: String?;
    var mimeType: String?;
    
    init(path: String, fileName: String?, mimeType: String?) {
      self.path = path
      self.fileName = fileName
      self.mimeType = mimeType
    }
  }
  
  @objc
  func clearFileNames(){
    let appDomain = Bundle.main.bundleIdentifier!
    let groupName = "group.\(appDomain)"
    let userDefaults = UserDefaults(suiteName: groupName)
    userDefaults?.set(nil, forKey: "ShareKey.media")
    userDefaults?.set(nil, forKey: "ShareKey.text")
    userDefaults?.set(nil, forKey: "ShareKey.url")
    let containerURL = FileManager.default
      .containerURL(forSecurityApplicationGroupIdentifier: groupName)!
    let shareTempDirPath = containerURL.appendingPathComponent("ShareTemp", isDirectory: true)
    do {
      let fileNames = try FileManager.default.contentsOfDirectory(atPath: shareTempDirPath.relativePath)
      for fileName in fileNames {
        let filePath = shareTempDirPath.appendingPathComponent(fileName)
        try FileManager.default.removeItem(at: filePath)
      }
    } catch {
      print(error)
    }
  }
  
  
  @objc
  static func requiresMainQueueSetup() -> Bool {
    return true
  }
}

func fileNameForPath(path: String) -> String? {
  let url = NSURL(fileURLWithPath: path)
  return url.lastPathComponent
}

func mimeTypeForPath(path: String) -> String {
  let url = NSURL(fileURLWithPath: path)
  let pathExtension = url.pathExtension
  
  if let uti = UTTypeCreatePreferredIdentifierForTag(kUTTagClassFilenameExtension, pathExtension! as NSString, nil)?.takeRetainedValue() {
    if let mimetype = UTTypeCopyPreferredTagWithClass(uti, kUTTagClassMIMEType)?.takeRetainedValue() {
      return mimetype as String
    }
    return "application/octet-stream"
  }
  return "application/octet-stream"
}

import Foundation
import Photos

@objc(ReceiveSharingIntent)
class ReceiveSharingIntent: NSObject {
    
    private var initialMedia: [SharedMediaFile]? = nil
    private var latestMedia: [SharedMediaFile]? = nil
    
    private var initialText: String? = nil
    private var latestText: String? = nil
    
    
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
            if url.fragment == "media" {
                if let key = url.host?.components(separatedBy: "=").last,
                    let json = userDefaults?.object(forKey: key) as? Data {
                    let sharedArray = decode(data: json)
                    let sharedMediaFiles: [SharedMediaFile] = sharedArray.compactMap {
                        guard let path = getAbsolutePath(for: $0.path) else {
                            return nil
                        }
                        if ($0.type == .video && $0.thumbnail != nil) {
                            let thumbnail = getAbsolutePath(for: $0.thumbnail!)
                            return SharedMediaFile.init(path: path, thumbnail: thumbnail, duration: $0.duration, type: $0.type)
                        } else if ($0.type == .video && $0.thumbnail == nil) {
                            return SharedMediaFile.init(path: path, thumbnail: nil, duration: $0.duration, type: $0.type)
                        }
                        
                        return SharedMediaFile.init(path: path, thumbnail: nil, duration: $0.duration, type: $0.type)
                    }
                    latestMedia = sharedMediaFiles
                    let json = toJson(data: latestMedia);
                    return json;
                }
            } else if url.fragment == "file" {
                if let key = url.host?.components(separatedBy: "=").last,
                    let json = userDefaults?.object(forKey: key) as? Data {
                    let sharedArray = decode(data: json)
                    let sharedMediaFiles: [SharedMediaFile] = sharedArray.compactMap{
                        guard let path = getAbsolutePath(for: $0.path) else {
                            return nil
                        }
                        return SharedMediaFile.init(path: path, thumbnail: nil, duration: nil, type: $0.type)
                    }
                    latestMedia = sharedMediaFiles
                     let json = toJson(data: latestMedia);
                    return json;
                }
            } else if url.fragment == "text" {
                if let key = url.host?.components(separatedBy: "=").last,
                    let sharedArray = userDefaults?.object(forKey: key) as? [String] {
                    latestText =  sharedArray.joined(separator: ",")
                    
                    let optionalString = latestText;
                    if let unwrapped = optionalString {
                        let text = "text:" + unwrapped;
                        return text;
                    }
                    return latestText!;
                    
                }
            } else {
                latestText = url.absoluteString
                
                let optionalString = latestText;
                // now unwrap it
                if let unwrapwebUrl = optionalString {
                    let webUrl = "webUrl:"+unwrapwebUrl;
                   return webUrl;
                }
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
        var thumbnail: String?; // video thumbnail
        var duration: Double?; // video duration in milliseconds
        var type: SharedMediaType;
        
        
        init(path: String, thumbnail: String?, duration: Double?, type: SharedMediaType) {
            self.path = path
            self.thumbnail = thumbnail
            self.duration = duration
            self.type = type
        }
    }
    
    enum SharedMediaType: Int, Codable {
        case image
        case video
        case file
    }
    
    
    @objc
    func clearFileNames(){
        print("clearFileNames");
    }
    

    @objc
    static func requiresMainQueueSetup() -> Bool {
        return true
    }
}

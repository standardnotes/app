export interface MediaManagerInterface {
  askForMediaAccess(type: 'camera' | 'microphone'): Promise<boolean>
}

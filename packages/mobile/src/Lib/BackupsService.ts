import { ApplicationService, ButtonType, Platform } from '@standardnotes/snjs'
import { Base64 } from 'js-base64'
import { Alert, PermissionsAndroid, Share } from 'react-native'
import FileViewer from 'react-native-file-viewer'
import RNFS from 'react-native-fs'
import Mailer from 'react-native-mail'
import { MobileApplication } from './Application'

export class BackupsService extends ApplicationService {
  /*
    On iOS, we can use Share to share a file of arbitrary length.
    This doesn't work on Android however. Seems to have a very low limit.
    For Android, we'll use RNFS to save the file to disk, then FileViewer to
    ask the user what application they would like to open the file with.
    For .txt files, not many applications handle it. So, we'll want to notify the user
    the path the file was saved to.
   */

  async export(encrypted: boolean): Promise<boolean | void> {
    const data = encrypted
      ? await this.application.createEncryptedBackupFile()
      : await this.application.createDecryptedBackupFile()
    const prettyPrint = 2
    const stringifiedData = JSON.stringify(data, null, prettyPrint)

    const modifier = encrypted ? 'Encrypted' : 'Decrypted'
    const filename = `Standard Notes ${modifier} Backup - ${this.formattedDate()}.txt`
    if (data) {
      if (this.application?.platform === Platform.Ios) {
        return this.exportIOS(filename, stringifiedData)
      } else {
        const result = await this.showAndroidEmailOrSaveOption()
        if (result === 'email') {
          return this.exportViaEmailAndroid(Base64.encode(stringifiedData), filename)
        } else if (result === 'save') {
          await this.exportAndroid(filename, stringifiedData)
        } else {
          return
        }
      }
    }
  }

  private async showAndroidEmailOrSaveOption() {
    try {
      const confirmed = await this.application!.alertService?.confirm(
        'Choose Export Method',
        '',
        'Email',
        ButtonType.Info,
        'Save to Disk',
      )
      if (confirmed) {
        return 'email'
      } else {
        return 'save'
      }
    } catch (e) {
      return undefined
    }
  }

  private async exportIOS(filename: string, data: string) {
    return new Promise<boolean>(resolve => {
      void (this.application! as MobileApplication).getAppState().performActionWithoutStateChangeImpact(async () => {
        Share.share({
          title: filename,
          message: data,
        })
          .then(result => {
            resolve(result.action !== Share.dismissedAction)
          })
          .catch(() => {
            resolve(false)
          })
      })
    })
  }

  private async exportAndroid(filename: string, data: string) {
    try {
      let filepath = `${RNFS.ExternalDirectoryPath}/${filename}`
      const granted = await this.requestStoragePermissionsAndroid()
      if (granted) {
        filepath = `${RNFS.DownloadDirectoryPath}/${filename}`
      }
      await RNFS.writeFile(filepath, data)
      void this.showFileSavePromptAndroid(filepath)
    } catch (err) {
      console.error('Error exporting backup', err)
      void this.application.alertService.alert('There was an issue exporting your backup.')
    }
  }

  private async openFileAndroid(filepath: string) {
    return FileViewer.open(filepath)
      .then(() => {
        // success
        return true
      })
      .catch(error => {
        console.error('Error opening file', error)
        return false
      })
  }

  private async showFileSavePromptAndroid(filepath: string) {
    const confirmed = await this.application!.alertService?.confirm(
      `Your backup file has been saved to your local disk at this location:\n\n${filepath}`,
      'Backup Saved',
      'Open File',
      ButtonType.Info,
      'Done',
    )
    if (confirmed) {
      void this.openFileAndroid(filepath)
    }
    return true
  }

  private async exportViaEmailAndroid(data: string, filename: string) {
    return new Promise<boolean>(resolve => {
      const fileType = '.json' // Android creates a tmp file and expects dot with extension

      let resolved = false
      Mailer.mail(
        {
          subject: 'Standard Notes Backup',
          recipients: [''],
          body: '',
          isHTML: true,
          attachment: { data, type: fileType, name: filename },
        },
        (error: any) => {
          if (error) {
            Alert.alert('Error', 'Unable to send email.')
          }
          resolved = true
          resolve(false)
        },
      )

      // On Android the Mailer callback event isn't always triggered.
      setTimeout(function () {
        if (!resolved) {
          resolve(true)
        }
      }, 2500)
    })
  }

  private async requestStoragePermissionsAndroid() {
    const writeStorageGranted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE)
    return writeStorageGranted === PermissionsAndroid.RESULTS.GRANTED
  }

  /* Utils */

  private formattedDate() {
    return new Date().getTime()
  }
}

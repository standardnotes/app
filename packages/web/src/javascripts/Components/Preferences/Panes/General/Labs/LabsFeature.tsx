import { Subtitle, Text } from '@/Components/Preferences/PreferencesComponents/Content'
import Switch from '@/Components/Switch/Switch'

type Props = {
  name: string
  description: string
  toggleFeature: () => void
  isEnabled: boolean
}

const LabsFeature = ({ name, description, toggleFeature, isEnabled }: Props) => {
  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-col">
        <Subtitle>{name}</Subtitle>
        <Text>{description}</Text>
      </div>
      <Switch onChange={toggleFeature} checked={isEnabled} />
    </div>
  )
}

export default LabsFeature

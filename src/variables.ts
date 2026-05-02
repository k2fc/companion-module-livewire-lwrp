import { ModuleInstance } from './main.js'

export type VariablesSchema = {
	variable1: string
	variable2: string
	variable3: string
}

export function UpdateVariableDefinitions(self: ModuleInstance): void {
	const variableDefinitions: any = {}

	for (let i = 1; i <= self.DestCount; i++) {
		variableDefinitions[`dst_${i}_name`] = { name: `Destination ${i} Name` }
		variableDefinitions[`dst_${i}_addr`] = { name: `Destination ${i} Source Address` }
		variableDefinitions[`dst_${i}_ougn`] = { name: `Destination ${i} Output Gain` }
		variableDefinitions[`dst_${i}_nchn`] = { name: `Destination ${i} Number of Channels` }
	}

	for (let i = 1; i <= self.SrcCount; i++) {
		variableDefinitions[`src_${i}_psnm`] = { name: `Source ${i} Name` }
		variableDefinitions[`src_${i}_rtpe`] = { name: `Source ${i} Enabled` }
		variableDefinitions[`src_${i}_rtpa`] = { name: `Source ${i} RTP Address` }
		variableDefinitions[`src_${i}_ingn`] = { name: `Source ${i} Input Gain` }
		variableDefinitions[`src_${i}_nchn`] = { name: `Source ${i} Number of Channels` }
	}

	for (let i = 1; i < self.GpiCount; i++) {
		variableDefinitions[`gpi_${i}_raw`] = { name: `GPI ${i} Raw` }
		for (let pin = 1; pin <= 5; pin++) {
			variableDefinitions[`gpi_${i}_pin_${pin}_state`] = { name: `GPI ${i} Pin ${pin} State` }
		}
	}

	for (let i = 1; i < self.GpoCount; i++) {
		variableDefinitions[`gpo_${i}_raw`] = { name: `GPO ${i} Raw` }
		for (let pin = 1; pin <= 5; pin++) {
			variableDefinitions[`gpo_${i}_pin_${pin}_state`] = { name: `GPO ${i} Pin ${pin} State` }
		}
	}

	self.setVariableDefinitions(variableDefinitions)
}

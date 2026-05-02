import { ModuleInstance } from './main.js'

export type FeedbacksSchema = {
	gpo_state: {
		type: 'boolean'
		options: {
			port: number
			pin: number
		}
	}
	gpi_state: {
		type: 'boolean'
		options: {
			port: number
			pin: number
		}
	}
	destination_source_address: {
		type: 'boolean'
		options: {
			dst: number
			src: string
		}
	}
}
function compareLivewireAddresses(str1: string, str2: string): boolean {
	const getIp = (input: string): string => {
		const match = input.match(/^\d{1,3}(?:\.\d{1,3}){3}|^\d+/)
		if (!match) return ''

		const value = match[0]

		if (/^\d+$/.test(value)) {
			const channel = parseInt(value, 10)
			const h = Math.floor(channel / 256)
			const l = channel % 256
			return `239.192.${h}.${l}`
		}

		return value
	}

	return getIp(str1) === getIp(str2)
}

export function UpdateFeedbacks(self: ModuleInstance): void {
	self.setFeedbackDefinitions({
		gpo_state: {
			name: 'GPO Pin State',
			type: 'boolean',
			description: 'Change button style based on GPO pin state',
			defaultStyle: {
				bgcolor: 0xffffff,
				color: 0x000000,
			},
			options: [
				{ type: 'number', label: 'Port', id: 'port', default: 1, min: 1, max: self.GpoCount },
				{ type: 'number', label: 'Pin', id: 'pin', default: 1, min: 1, max: 5 },
			],
			callback: (feedback) => {
				const port = feedback.options.port
				const pin = feedback.options.pin

				const state = self.getVariableValue(`gpo_${port}_pin_${pin}_state`)
				return state === true
			},
		},
		gpi_state: {
			name: 'GPI Pin State',
			type: 'boolean',
			description: 'Change button style based on GPI pin state',
			defaultStyle: {
				bgcolor: 0xffffff,
				color: 0x000000,
			},
			options: [
				{ type: 'number', label: 'Port', id: 'port', default: 1, min: 1, max: self.GpiCount },
				{ type: 'number', label: 'Pin', id: 'pin', default: 1, min: 1, max: 5 },
			],
			callback: (feedback) => {
				const port = feedback.options.port
				const pin = feedback.options.pin

				const state = self.getVariableValue(`gpi_${port}_pin_${pin}_state`)
				return state === true
			},
		},
		destination_source_address: {
			name: 'Destination Source Address',
			type: 'boolean',
			description: 'Change button style based on the Source routed to a Destination',
			defaultStyle: {
				bgcolor: 0xffffff,
				color: 0x000000,
			},
			options: [
				{ type: 'number', label: 'Destination Number', id: 'dst', default: 1, min: 1, max: self.DestCount },
				{ type: 'textinput', label: 'Source Address', id: 'src' },
			],
			callback: (feedback) => {
				const dst = feedback.options.dst
				const src = feedback.options.src
				const current_src = self.getVariableValue(`dst_${dst}_addr`)
				if (typeof current_src === 'string') return compareLivewireAddresses(src, current_src)
				return false
			},
		},
	})
}

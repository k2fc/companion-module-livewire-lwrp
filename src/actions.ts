import { ModuleInstance } from './main.js'

export type ActionsSchema = {
	set_gpo_pin: {
		options: {
			port: number
			pin: number
			state: string
		}
	}
	set_gpi_pin: {
		options: {
			port: number
			pin: number
			state: string
		}
	}
	set_destination_source: {
		options: {
			dst: number
			src: string
		}
	}
}

export function UpdateActions(self: ModuleInstance): void {
	self.setActionDefinitions({
		set_gpo_pin: {
			name: 'Set GPO Pin State',
			options: [
				{ type: 'number', label: 'Port', id: 'port', default: 1, min: 1, max: self.GpoCount },
				{ type: 'number', label: 'Pin', id: 'pin', default: 1, min: 1, max: 5 },
				{
					type: 'dropdown',
					label: 'State',
					id: 'state',
					default: 'L',
					choices: [
						{ id: 'L', label: 'Low' },
						{ id: 'H', label: 'High' },
					],
				},
			],
			callback: async (action) => {
				const port = action.options.port
				const pin = action.options.pin
				const state = action.options.state

				let cmdString = ''
				for (let i = 1; i <= 5; i++) {
					cmdString += i === pin ? state : 'x'
				}
				self.log('debug', `Action triggered for port ${port}`)
				self.sendCommand(`GPO ${port} ${cmdString}`)
			},
		},
		set_gpi_pin: {
			name: 'Set GPI Pin State',
			options: [
				{ type: 'number', label: 'Port', id: 'port', default: 1, min: 1, max: self.GpiCount },
				{ type: 'number', label: 'Pin', id: 'pin', default: 1, min: 1, max: 5 },
				{
					type: 'dropdown',
					label: 'State',
					id: 'state',
					default: 'L',
					choices: [
						{ id: 'L', label: 'Low' },
						{ id: 'H', label: 'High' },
					],
				},
			],
			callback: async (action) => {
				const port = action.options.port
				const pin = action.options.pin
				const state = action.options.state

				let cmdString = ''
				for (let i = 1; i <= 5; i++) {
					cmdString += i === pin ? state : 'x'
				}

				self.sendCommand(`GPI ${port} ${cmdString}`)
			},
		},
		set_destination_source: {
			name: 'Set Destination Source Address',
			options: [
				{ type: 'number', label: 'Destination Number', id: 'dst', default: 1, min: 1, max: self.DestCount },
				{ type: 'textinput', label: 'Source Address', id: 'src', regex: '/^[^"\']*$/' },
			],
			callback: async (action) => {
				const dst = action.options.dst
				const src = action.options.src

				const src_int = parseInt(src)
				if (src_int === undefined) self.sendCommand(`DST ${dst} ADDR:"${src}"`)
				else self.sendCommand(`DST ${dst} ADDR:${src}`)
			},
		},
	})
}

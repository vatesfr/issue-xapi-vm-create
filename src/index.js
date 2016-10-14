#!/usr/bin/env node

import execPromise from 'exec-promise'
import pw from 'pw'
import { createClient } from 'xen-api'

// ===================================================================

const askPassword = () => new Promise(resolve => {
  process.stdout.write('Password: ')
  pw(resolve)
})

const noop = () => {}

const required = name => {
  const e = `missing required argument <${name}>`
  throw e
}

// ===================================================================

execPromise(async args => {
  const [
    url = required('url'),
    user = required('user'),
    password = await askPassword()
  ] = args

  const xapi = createClient({
    auth: { user, password },
    url,
    watchEvents: false
  })
  await xapi.connect()

  const ref = await xapi.call('VM.create', {
    actions_after_crash: 'restart',
    actions_after_reboot: 'restart',
    actions_after_shutdown: 'destroy',
    affinity: 'OpaqueRef:NULL',
    HVM_boot_params: { orders: 'cdn' },
    HVM_boot_policy: 'BIOS order',
    is_a_template: false,
    memory_dynamic_max: 4294967296,
    memory_dynamic_min: 4294967296,
    memory_static_max: 4294967296,
    memory_static_min: 134217728,
    other_config: {},
    PCI_bus: '',
    platform: {},
    PV_args: '',
    PV_bootloader: '',
    PV_bootloader_args: '',
    PV_kernel: '',
    PV_legacy_args: '',
    PV_ramdisk: '',
    recommendations: '',
    user_version: 1,
    VCPUs_at_startup: 1,
    VCPUs_max: 1,
    VCPUs_params: {}
  })
  console.log('VM successfully created')

  console.log(await xapi.call('VM.get_record', ref))

  try {
    await xapi.call('VM.destroy', ref).then(noop)
    console.log('VM successfully destroyed')
  } catch (error) {
    console.error('failed to destroy VM', error)
  }
  await xapi.disconnect().catch(noop)
})

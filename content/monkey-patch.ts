declare const Components: any
declare const Zotero: any
declare const AddonManager: any

import { flash } from './flash'
import { client } from './client'
import * as built_against from '../gen/min-version.json'

export function clean_pane_persist() {
  let persisted = Zotero.Prefs.get('pane.persist')
  if (persisted) {
    try {
      persisted = JSON.parse(persisted)
      delete persisted['zotero-items-column-citekey']
      Zotero.Prefs.set('pane.persist', JSON.stringify(persisted))
    } catch (err) {
      Zotero.logError(err)
    }
  }
}

const versionCompare = Components.classes['@mozilla.org/xpcom/version-comparator;1'].getService(Components.interfaces.nsIVersionComparator)
export let enabled = versionCompare.compare(Zotero.version.replace('m', '.').replace(/-beta.*/, ''), built_against[client].min.replace('m', '.')) > 0

Zotero.debug(`monkey-patch: ${Zotero.version}: BBT ${enabled ? 'en' : 'dis'}abled`)
if (!enabled) {
  clean_pane_persist()
  flash(`OUTDATED ${client.toUpperCase()} VERSION`, `BBT has been disabled\nNeed at least ${client} ${built_against[client].min}, found ${Zotero.version}, please upgrade.`, 30) // tslint:disable-line:no-magic-numbers

  Components.utils.import('resource://gre/modules/AddonManager.jsm')
  AddonManager.getAddonByID('better-bibtex@iris-advies.com', addon => { addon.userDisabled = true })
    /*
    // Add-on cannot be uninstalled
    if (!(addon.permissions & AddonManager.PERM_CAN_UNINSTALL)) return // tslint:disable-line:no-bitwise

    addon.uninstall()
    // if (addon.pendingOperations & AddonManager.PENDING_UNINSTALL) {
    // Need to restart to finish the uninstall.
    // Might ask the user to do just that. Or not ask and just do.
    // Or just wait until the browser is restarted by the user.
    // }
  })
  */
}

const marker = 'BetterBibTeXMonkeyPatched'

export function repatch(object, method, patcher) {
  if (!enabled) return
  object[method] = patcher(object[method])
  object[method][marker] = true
}

export function patch(object, method, patcher) {
  if (!enabled) return
  if (object[method][marker]) throw new Error(`${method} re-patched`)
  repatch(object, method, patcher)
}

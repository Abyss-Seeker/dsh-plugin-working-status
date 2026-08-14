![棰樺浘](docs/images/cover.png)

[English version](README.en.md)

# dsh-plugin-working-status

涓€鍙ヨ瘽姒傛嫭锛氭妸鎬濊€冪姸鎬侀噷閭ｅ彞 "Deep diving..." 鏀规垚浣犲枩娆㈢殑浠讳綍璇濃€斺€旂偣鍑诲嵆鏀癸紝鍏ㄥ眬鐢熸晥锛岄噸鍚兘涓嶅繕銆?
## 蹇€熷畨瑁?
```sh
dsh plugin --profile web add github:Abyss-Seeker/dsh-plugin-working-status
```

鍐嶅埌 `$DSH_HOME/profiles/web/cordis.patch.yml` 閲屽惎鐢ㄤ竴琛岋紙瑙佷笅鏂囥€屽畨瑁呫€嶏級锛屽埛鏂?GUI 椤甸潰灏辫兘鐢ㄣ€?
## 瀹冭兘骞蹭粈涔?
- **鐐瑰嚮瀛楁鐩存帴鏀广€?* 鐐逛竴涓嬬姸鎬佹枃瀛楋紙鎴栬€呮梺杈圭殑璁℃椂锛夛紝鍘熷湴寮瑰嚭杈撳叆妗嗭紝鍥炶溅鎴栫偣鍒淇濆瓨锛宍Esc` 鍙嶆倲銆?- **鏀逛竴娆★紝澶勫鐢熸晥銆?* 鏂版枃瀛椾細瑕嗙洊褰撳墠鍜屼互鍚庢墍鏈夎疆娆°€佹墍鏈変細璇濓紝鍒锋柊椤甸潰銆侀噸鍚簲鐢ㄩ兘杩樺湪銆?- **娓呯┖鎻愪氦鍗宠繕鍘熴€?* 鎶婅緭鍏ユ娓呯┖鍐嶆彁浜わ紝灏卞洖鍒扮晫闈㈠嚭鍘傞粯璁ゆ枃瀛楋紙榛樿鏂囧瓧鏄粠瀹為檯娓叉煋閲屾姄鐨勶紝浠ュ悗瀹樻柟鏀规枃妗堜篃鑳借窡寰椾笂锛夈€?- **涓嶇浠讳綍鏍峰紡銆?* 鍙敼閭ｄ竴涓枃鏈妭鐐圭殑鍐呭锛氭祦鍏夊姩鐢汇€佽鏃跺櫒銆佹棤闅滅鏍囪銆佸姞杞借繃绋嬬殑娓叉煋锛屽叏閮藉師鏍枫€?
## 鎿嶄綔鏂瑰紡

鐐瑰嚮 "Deep diving..." 鐩存帴缂栬緫锛?
![鐐瑰嚮鐘舵€佹枃瀛楃洿鎺ョ紪杈慮(docs/images/click-to-edit.png)

## 鏁堟灉棰勮

| 鏁堟灉涓€ | 鏁堟灉浜?|
| --- | --- |
| ![鏁堟灉涓€](docs/images/effect-1.png) | ![鏁堟灉浜宂(docs/images/effect-2.png) |

## 瀹夎

涓€鏉″懡浠わ細

```sh
dsh plugin --profile web add github:Abyss-Seeker/dsh-plugin-working-status
```

鍐嶅湪 profile 鐨勮ˉ涓佸眰 `$DSH_HOME/profiles/web/cordis.patch.yml` 閲屽惎鐢ㄨ繖涓€琛岋細

```yaml
- insert:
    - id: working-status-editor
      name: dsh-plugin-working-status
```

鍒锋柊涓€涓?GUI 椤甸潰鍗冲彲銆傚寘鏈韩鏃犻渶鏋勫缓锛屼粨搴撻噷鐨?`lib/` 灏辨槸鏈€缁堜骇鐗╋紱涔熷彲浠ョ敤 `file:` 璺緞鎴?npm 鍖呭悕瀹夎锛屽厤 pnpm 鐨勫厹搴曟柟妗堣 `scripts/install.mjs`銆?
## 鎻掍欢閰嶇疆鍗＄墖

瀹夎鍚庯紝璁剧疆 鈫?鎻掍欢 鈫?鎻掍欢閰嶇疆 閲屼細澶氬嚭涓€寮犮€屽伐浣滅姸鎬?/ Working status銆嶅崱鐗囷細鍚屾牱鐨勫瓧娈碉紝甯︿繚瀛樸€佹斁寮冧慨鏀广€佹仮澶嶉粯璁わ紝鍜岀偣鍑荤紪杈戝啓鐨勬槸鍚屼竴涓€笺€?
## 鍜?dsh-web-ui 涓€璧风敤

瑁呬簡 dsh-web-ui锛圫SH銆佷换鍔＄湅鏉块偅涓€濂楋級涔熸病闂锛屽悇鍗犲悇鐨勫崱鐗囷紝浜掍笉鎵撴壈锛?
![涓?dsh-web-ui 鍏卞瓨](docs/images/with-dsh-web-ui.png)

## 鎸佷箙鍖栫殑瀹炶瘽

- 鐜板湪鏂囧瓧瀛樺湪娴忚鍣ㄧ殑 localStorage 闀滃儚锛坄dsh.turn-status.label`锛夐噷锛氬悓婧愭墍鏈夋爣绛鹃〉鍏变韩锛屽埛鏂般€侀噸鍚兘鍦ㄣ€?- Host 鍗婅竟涔熸敞鍐屼簡 `turn-status` 璁剧疆鍛藉悕绌洪棿锛屼絾鐩墠 DSH 鐨?API 缃戝叧鍙悜娴忚鍣ㄦ斁琛屽浐瀹氱櫧鍚嶅崟閲岀殑鍛藉悕绌洪棿锛坄dsh-host-apiproxy` 鐨?`WEB_SETTINGS_NAMESPACES`锛夛紝绗笁鏂瑰懡鍚嶇┖闂村嵆浣挎敞鍐屾垚鍔熶篃鍙細寰楀埌 `settings-not-exposed`銆傝鎻掍欢鍦?`settings.register()` 鏃惰嚜琛屾毚闇查厤缃紝鍦ㄨ鍖呮簮鐮侀噷鏄爣娉ㄧ殑寰呭姙浜嬮」锛涚瓑瀹冭惤鍦帮紝鏈彃浠朵細鑷姩鏀圭敤 Host 瀛樺偍锛宭ocalStorage 浣滀负鍏滃簳锛屼綘鐨勬枃瀛楀埌鍝効閮戒笉浼氫涪銆?
## 鎺掓煡涓庡吋瀹规€?
- `window.__dshWorkingStatusEditor` 鏆撮湶 `elements()`锛堝綋鍓嶅尮閰嶅埌鐨勭姸鎬佸瓧娈碉級鍜?`label()`锛堢敓鏁堟枃瀛楋級锛屾柟渚挎帓鏌ャ€?- 鐘舵€佸瓧娈甸潬 `role="status"` + `aria-live="polite"` + 绋冲畾鐨?`turnStatus` CSS-module 鏈湴绫诲悕璇嗗埆锛涗竾涓€灏嗘潵鐨?DSH 鏀逛簡绫诲悕锛屾彃浠跺彧浼氬憡璀﹀苟鍋滄鏀瑰啓锛屼笉浼氬紕鍧忛〉闈€?- 閰嶇疆鍗＄墖娉ㄥ唽鍦?`ui-settings-plugins` 澹版槑鐨?`settings.plugin.item` 鎻掓Ы閲岋紱娌℃湁閭ｄ釜璁剧疆鐣岄潰鏃讹紝鐐瑰嚮缂栬緫鍔熻兘鐓у父宸ヤ綔銆?
## 寮€鍙?
- `test/smoke.mjs` 鐢ㄥ亣 DOM 瑕嗙洊浜嗘浛鎹€佹彁浜?鍙栨秷/杩樺師銆佸崱鐗囪〃鍗曞拰鎸佷箙鍖栧悓姝ワ紝鏀瑰畬璺戜竴閬嶅嵆鍙€?- 鏀逛簡婧愮爜鎯冲悓姝ヨ繘 profile锛氶噸璺戜笂闈㈢殑瀹夎鍛戒护锛屾垨 `node scripts/install.mjs "$DSH_HOME/profiles/web"`銆?
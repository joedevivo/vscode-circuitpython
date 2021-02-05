echo off
mkdir -p bindings
SET electron="11.0.0" "10.0.0" "9.0.0" 
Rem    ./scripts/build-bindings.sh $(System.DefaultWorkingDirectory)
Rem where I want bindings to end up:
Rem $(System.DefaultWorkingDirectory)/node_modules/$(module)/lib/binding/node-v$(abi)-$(platform)-$(arch)/bindings.node
set working=%cd%

cd node_modules\%1
for %%e in (%electron%) do (call %working%\node_modules\.bin\prebuild.cmd -t %%e% -r electron)
Rem $working/node_modules/.bin/prebuild.cmd -t $e -r electron
Rem done

Rem COPY prebuilds %working%\bindings
cd %working%
xcopy node_modules\%1\prebuilds bindings /s /e /Y
{ }:

let pkgs = import (fetchTarball "https://github.com/NixOS/nixpkgs/archive/ba913eda2df8eb72147259189d55932012df6301.tar.gz") { overlays = [  ]; };
in with pkgs;
  let
    APPEND_LIBRARY_PATH = "${lib.makeLibraryPath [  ] }";
    myLibraries = writeText "libraries" ''
      export LD_LIBRARY_PATH="${APPEND_LIBRARY_PATH}:$LD_LIBRARY_PATH"
      
    '';
  in
    buildEnv {
      name = "ba913eda2df8eb72147259189d55932012df6301-env";
      paths = [
        (runCommand "ba913eda2df8eb72147259189d55932012df6301-env" { } ''
          mkdir -p $out/etc/profile.d
          cp ${myLibraries} $out/etc/profile.d/ba913eda2df8eb72147259189d55932012df6301-env.sh
        '')
        caddy
      ];
    }

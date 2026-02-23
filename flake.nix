{
  description = "MIX Checker Frontend";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};

        yarnOfflineCache = pkgs.fetchYarnDeps {
          yarnLock = "${self}/yarn.lock";
          hash = "sha256-PaQ1mu8+jOg32SIK/erS0MmTOwDh/trlHsYZfZMmJ4s=";
        };

        frontend = pkgs.stdenv.mkDerivation {
          name = "checker_frontend";
          src = self;
          inherit yarnOfflineCache;
          
          dontStrip = true;
          buildInputs = [pkgs.nodejs pkgs.yarnConfigHook pkgs.yarnBuildHook pkgs.yarnInstallHook];
          installPhase =  ''
          mkdir $out
          mv build $out/www
          '';

        };
      in 
        {
          packages = {
            yco = yarnOfflineCache;
            default = frontend;
          };
          devShells = {
            default = pkgs.mkShell {
              buildInputs = with pkgs; [
                yarn
                nodejs
              ];
            };
          };
        }
    );
}

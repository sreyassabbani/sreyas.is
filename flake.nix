{
  inputs.nixpkgs.url = "https://flakehub.com/f/DeterminateSystems/nixpkgs-weekly/0.tar.gz";

  outputs =
    { self, nixpkgs, ... }:
    let
      systems = [
        "aarch64-darwin"
        "x86_64-darwin"
        "aarch64-linux"
        "x86_64-linux"
      ];
      forAllSystems =
        f:
        builtins.listToAttrs (
          map (system: {
            name = system;
            value = f system;
          }) systems
        );
    in
    {
      devShells = forAllSystems (
        system:
        let
          pkgs = nixpkgs.legacyPackages.${system};
        in
        {
          default = pkgs.mkShell {
            packages = with pkgs; [
              nodejs_24
              bun
              nushell
              harfbuzz
              (python3.withPackages (ps: [ ps.fonttools ps.brotli ]))
            ];

            shellHook = ''
              export PATH="$PWD/node_modules/.bin:$PATH"
              echo "[shellHook] Nix dev shell activated"
            '';
          };
        }
      );
    };
}

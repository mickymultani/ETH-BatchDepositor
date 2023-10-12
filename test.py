# Your keys
keys = [
    "b9ed3594797257462ce20cc558eb6ace9d4dbca5d6d5354e43d1c9d463d28fbb4204b98e9676092df70720a82cb6fd9e",  # pubkey, 48 bytes
    "010000000000000000000000dd6e67942a9566a70446f7400a21240c5f71377c",  # credentialsLength, 32 bytes
    "aaa08b2fe49bc555da5259de0500cd1b381c076e8cc227debf7fee391f4fe5d4b9d52c5bfa5b1a1ea1feb986e6961fc60ce9a55bc33e86ec763e62b8f1d4ac6e7b3b5cc70f0616d6f600a85f7a7a571bde2db6c2d4eab106f28fbcf9365d3af4"  # signatureLength, 96 bytes
]

def validateK(keys):
    # Expected sizes from abyss contract
    expected_sizes = [48, 32, 96]

    for key, expected_size in zip(keys, expected_sizes):
        # Convert hex string length to byte length
        actual_byte_size = len(key) // 2
        assert actual_byte_size == expected_size, f"Key size mismatch: Expected {expected_size} bytes but got {actual_byte_size} bytes."



error_message = None

try:
    validateK(keys)
except AssertionError as e:
    error_message = str(e)

error_message

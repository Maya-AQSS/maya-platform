<?php

declare(strict_types=1);

use Symplify\MonorepoBuilder\Config\MBConfig;
use Symplify\MonorepoBuilder\Release\ReleaseWorker\AddTagToChangelogReleaseWorker;
use Symplify\MonorepoBuilder\Release\ReleaseWorker\PushNextDevReleaseWorker;
use Symplify\MonorepoBuilder\Release\ReleaseWorker\PushTagReleaseWorker;
use Symplify\MonorepoBuilder\Release\ReleaseWorker\SetCurrentMutualDependenciesReleaseWorker;
use Symplify\MonorepoBuilder\Release\ReleaseWorker\SetNextMutualDependenciesReleaseWorker;
use Symplify\MonorepoBuilder\Release\ReleaseWorker\TagVersionReleaseWorker;
use Symplify\MonorepoBuilder\Release\ReleaseWorker\UpdateBranchAliasReleaseWorker;
use Symplify\MonorepoBuilder\Release\ReleaseWorker\UpdateReplaceReleaseWorker;

return static function (MBConfig $mbConfig): void {
    // Only PHP packages live here. JS packages are orchestrated by pnpm.
    $mbConfig->packageDirectories([
        __DIR__ . '/packages/php',
    ]);

    // El repo usa `main`; sin esto monorepo-builder hereda el default 'master'
    // y `PushNextDevReleaseWorker` falla con
    // "git push origin master → src refspec master does not match any".
    $mbConfig->defaultBranch('main');

    // Keep dev dependencies in sync across all PHP packages.
    $mbConfig->dataToAppend([
        'require-dev' => [
            'pestphp/pest' => '^3.0',
            'pestphp/pest-plugin-laravel' => '^3.0',
            'orchestra/testbench' => '^9.0 || ^10.0',
            'mockery/mockery' => '^1.6',
        ],
    ]);

    // Standard release pipeline: validate → bump deps → tag → push.
    $mbConfig->workers([
        UpdateReplaceReleaseWorker::class,
        SetCurrentMutualDependenciesReleaseWorker::class,
        AddTagToChangelogReleaseWorker::class,
        TagVersionReleaseWorker::class,
        PushTagReleaseWorker::class,
        SetNextMutualDependenciesReleaseWorker::class,
        UpdateBranchAliasReleaseWorker::class,
        PushNextDevReleaseWorker::class,
    ]);
};

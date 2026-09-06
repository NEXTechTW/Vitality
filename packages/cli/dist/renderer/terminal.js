/**
 * Terminal renderer — produces the bar chart output for the CLI.
 */
import chalk from 'chalk';
const BAR_WIDTH = 20;
function bar(score) {
    const filled = Math.round((score / 100) * BAR_WIDTH);
    const empty = BAR_WIDTH - filled;
    return chalk.green('█'.repeat(filled)) + chalk.gray('░'.repeat(empty));
}
function scoreColor(score) {
    if (score >= 80)
        return chalk.green;
    if (score >= 60)
        return chalk.yellow;
    return chalk.red;
}
function grade(score) {
    if (score >= 90)
        return 'A';
    if (score >= 80)
        return 'B+';
    if (score >= 70)
        return 'B';
    if (score >= 60)
        return 'C+';
    if (score >= 50)
        return 'C';
    return 'D';
}
export function renderReport(result) {
    const lines = [];
    lines.push('');
    lines.push(chalk.bold.white('  Vitality Health'));
    lines.push('');
    lines.push(`  ${bar(result.score)} ${scoreColor(result.score).bold(String(result.score))}${chalk.gray('/100')}  ${chalk.dim(`[${grade(result.score)}]`)}`);
    lines.push('');
    const dims = [
        ['Maintenance ', result.maintenance.score],
        ['Community   ', result.community.score],
        ['Security    ', result.security.score],
        ['Releases    ', result.releases.score],
    ];
    for (const [label, score] of dims) {
        lines.push(`  ${chalk.dim(label)}  ${bar(score)}  ${scoreColor(score)(String(score).padStart(3))}`);
    }
    lines.push('');
    lines.push(chalk.dim(`  Algorithm: ${result.algorithmVersion}  ·  Hash: ${result.computationHash.slice(0, 20)}…`));
    lines.push('');
    return lines.join('\n');
}
export function renderBreakdown(result) {
    const lines = [];
    const dimensions = [
        { name: 'Maintenance', data: result.maintenance },
        { name: 'Community', data: result.community },
        { name: 'Security', data: result.security },
        { name: 'Releases', data: result.releases },
    ];
    for (const { name, data } of dimensions) {
        lines.push('');
        lines.push(chalk.bold.white(`  ${name} Score: ${scoreColor(data.score)(String(data.score))}/100`));
        lines.push('');
        for (const item of data.breakdown) {
            const sign = item.delta >= 0 ? chalk.green(`+${item.delta}`) : chalk.red(String(item.delta));
            lines.push(`    ${sign.padEnd(8)}  ${chalk.dim(item.label)}`);
        }
    }
    lines.push('');
    return lines.join('\n');
}
//# sourceMappingURL=terminal.js.map